---
title: Security Model
description: Trust model, known risks, and hardening options for bulletinbored.
---
# Security Model

bulletinbored is built for a **single trusted administrator** who installs plugins, themes, language packs, and updates. The security model therefore assumes that installing code is a deliberate act of trust in its source (the author / the repository).

## What is hardened

- **Zip Slip is mitigated everywhere a package is extracted.** `PluginManager`, `ThemeManager`, `UpdateManager`, and the shared `extract_zip()` all validate every archive entry and reject `..` path traversal and absolute paths before writing.
- **Language packs are JSON only — no `eval()`.** Uploaded or installed translation files are parsed as plain JSON data. PHP language files are no longer supported, eliminating the supply-chain RCE vector.
- **TLS verification is enforced.** All update downloads (core, plugins, themes) verify the server certificate with `CURLOPT_SSL_VERIFYPEER=true` and `CURLOPT_SSL_VERIFYHOST=2`.
- **Attachment authorization.** `/download/{id}` verifies `can_view_thread()` before serving files. Attachments belonging to hidden/pending threads are protected by the same policy as the thread itself.
- **Plugin dependency graph.** Circular dependencies are detected and rejected. Disabling a plugin recursively disables all plugins that depend on it.
- **Core update aborts if backup fails.** The updater no longer proceeds without a safety net — if the backup step fails, the update is aborted.
- **Application state centralized.** The `App` class replaces scattered `$GLOBALS` access, reducing hidden coupling and making the trust boundary easier to reason about.
- **CSP tightened.** Scripts require a nonce. `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'` are enforced.
- **TrustedProxies IPv6 support.** The trusted proxy detection now supports IPv6 addresses and CIDR notation.
- **`shell_exec()` removed.** Git detection in diagnostics and repo_install now uses `exec()` with return code checking instead of `shell_exec()`.
- **Code modularized.** `helpers.php` fully split into `src/Helpers/` (Url, AuthHelpers, Upload, Mail, Notifications, Text, Avatar, Data). `posts.php` split into `posts-thread.php`, `posts-new.php`, `posts-edit.php`. All handlers use `App::getInstance()` instead of `global $pdo`. Reduces file complexity and eliminates global state coupling.
- **User content is sanitized.** HTML saved by the editor is filtered by `sanitize_html()`: scripts/styles are stripped, generic `div`/`span`, `id`, inline `style`, and arbitrary `data-*` attributes are removed, and event handlers (`on*`) are dropped. Output is served under a per-request nonce-based CSP. Social embeds (YouTube, Twitter/X, Instagram, Facebook) are permitted only from a fixed host allow-list.
- **Installer files do not re-appear after a core update.** `applyCoreUpdate()` removes `install.php`, `install2.php`, `install3.php`, and `api/install.php` from a deployed root once the forum is installed (`config.json` present). On a fresh
  install (no `config.json`) the scripts are kept so setup can run.
- **CSRF tokens rotate on every successful validation.** Each POST request validates the token and immediately issues a new one, preventing replay attacks. Use `csrf_validate_request()` in POST handlers. All state-changing operations (including watch/unwatch/logout) use POST with CSRF protection.
- **Input sanitization is centralized.** The `Bulletin\Request` class provides a single entry point for all user input (`get()`, `post()`, `input()`), ensuring consistent sanitization and eliminating the risk that a new handler forgets to escape input.
- **Admin actions are audit-logged.** Every state-changing admin action (user create/update/delete/ban/suspend, role changes, category changes, thread moderation, plugin/theme management) is logged to `data/logs/security.log` with admin identity, IP, timestamp, and context.

## Installing code is an act of trust

Plugins and themes are PHP code that is `include`d by the forum. A malicious package therefore means **remote code execution**. Because distribution is **decentralized** (anyone can publish a plugin/theme on any Git host), there is **no central signing authority** and bulletinbored does **not** implement cryptographic signature verification of packages.

Consequences for the operator:

- Installing or updating a plugin/theme means you trust its **author and its source**. This is by design for a decentralized ecosystem. There is no "safe" automatic path: even when a package comes from the curated catalog, an **update** applies a new package from that same source without a human re-reviewing the diff. You cannot pre-approve updates in a meaningful way without trusting the source — doing so would undermine the decentralized nature of the system.
- As defense-in-depth, keep `plugin_verify_files` / `theme_verify_files` **enabled** (on by default). At install time the package is checked against the `files` list in its `manifest.json`; a package that ships files not declared in the manifest (e.g. a dropped-in backdoor) is rejected. Note: this catches *added* files, not a manifest that itself was updated to include the malicious file — so it is a guard, not a guarantee.
- `catalog-only` mode (`allow_catalog_only`) restricts installation to `official: true` entries from the curated catalog. It reduces the set of sources to curated ones, but it does **not** give you pre-approval of updates: a curated source can still publish a new version at any time.

### Curated catalog: first-party vs third-party

The catalog mixes components developed by the bulletinbored team (**first-party**) and components developed by the community (**third-party**). The catalog UI labels each one accordingly ("Developed by bulletinbored team" vs "Developed by third party")
so you can see at a glance what is first-party and what is not.

Every catalog entry — first-party or third-party — is **reviewed by the bulletinbored team before being added to the catalog**. Even so, bulletinbored does **not** assume any responsibility for the code, security, or behavior of third-party plugins/themes: installing one remains an act of trust in its author. If a third-party (or first-party) component is later found to be malicious, bulletinbored will remove it from the catalog as soon as it is reported by a user — see [Reporting](#reporting) below.

> The pre-catalog review reduces risk but is not a guarantee: a component can be
> compromised after publication (e.g. via an update), and reviews are best-effort.
> Keep `*_verify_files` enabled and treat any installation as trusting the source.

> **Bottom line:** only install plugins/themes/updates from sources you trust. Keep
> `*_verify_files` enabled, prefer `catalog-only` mode if you want a smaller trusted
> surface, and review third-party code before deploying it on a production forum with
> untrusted users.

## Hardening options in `config.json`

| Key | Default | Effect |
|---|---|---|
| `plugin_verify_files` | `true` | Reject plugin packages whose extracted files don't match `manifest.json` `files`. |
| `theme_verify_files` | `true` | Same check for themes. |
| `allow_catalog_only` | `false` | When `true`, only `official: true` catalog entries can be installed. |
| `trusted_proxies` | `["127.0.0.1", "::1"]` | List of trusted proxy IPs (supports CIDR notation). Only trust `X-Forwarded-*` headers from these IPs. |

## CSRF Protection

CSRF tokens are per-session and rotate on every successful validation:

```php
// In POST handlers:
if (!csrf_validate_request()) {
    throw new \Bulletin\ForbiddenException('CSRF token invalid');
}
// Token is now rotated — old token is invalidated

// In forms:
echo csrf_field();  // generates <input type="hidden" name="csrf_token" value="...">
```

The `csrf_validate_request()` function validates the token from `$_POST['csrf_token']` or `$_SERVER['HTTP_X_CSRF_TOKEN']`, and if valid, issues a new token immediately. This prevents replay attacks.

## Input Sanitization

The `Bulletin\Request` class centralizes all user input:

```php
use Bulletin\Request;

$name = Request::post('name');           // sanitized (trim + stripslashes)
$page = Request::get('page', 1);         // with default
$raw  = Request::raw('query');           // un-sanitized (for prepared statements)
$has  = Request::has('field');           // existence check
$email = Request::email('email');        // validated email or empty string
$status = Request::enum('status', ['visible', 'hidden']); // allowlist
```

Output escaping remains the view layer's responsibility via `escape()` at render time.

## Authorization

All authorization is centralized through the `AuthZ` service (`lib/AuthZ.php`). Handlers must never check `is_admin()` or `$_SESSION['user_role']` directly — they use `$authz->can()` and `$authz->canOnOwned()` instead.

```php
global $authz;
$userId = (int)$_SESSION['user_id'];

// Check a permission
if (!$authz->can($userId, 'posts.edit')) {
    throw new \Bulletin\ForbiddenException('Not authorized');
}

// Check with ownership (uses "permission_own" variant for owners)
if (!$authz->canOnOwned($userId, 'posts.edit', (int)$post['user_id'])) {
    throw new \Bulletin\ForbiddenException('Not authorized');
}
```

Permissions use `resource.action` notation (e.g., `posts.edit`, `threads.delete`, `admin.access`). The full registry is documented in `lib/AuthZ.php`.

| Permission | Description |
|---|---|
| `admin.access` | Access admin panel |
| `threads.create` | Create new threads |
| `threads.edit` / `threads.edit_own` | Edit any / own thread |
| `threads.delete` / `threads.delete_own` | Delete any / own thread |
| `threads.lock` | Lock/unlock threads |
| `threads.sticky` | Sticky/unsticky threads |
| `threads.approve` | Approve pending threads |
| `threads.move` | Move thread to another category |
| `threads.split` / `threads.merge` | Split/merge threads |
| `posts.create` | Create replies |
| `posts.edit` / `posts.edit_own` | Edit any / own post |
| `posts.delete` / `posts.delete_own` | Delete any / own post |
| `users.create` / `users.edit` / `users.delete` | User management |
| `users.ban` / `users.suspend` | Ban/suspend users |
| `roles.manage` | Manage roles and permissions |
| `categories.manage` | Category management |
| `settings.manage` | Modify site settings |
| `plugins.manage` | Plugin management |
| `themes.manage` | Theme management |

## Admin Audit Log

All state-changing admin actions are logged to `data/logs/security.log`:

```
[2026-08-29T16:00:00+02:00] admin_user_ban ip=127.0.0.1 {"admin_id":1,"admin_user":"admin","target_id":42}
```

Logged actions include: user create/update/delete/ban/unban/suspend, role create/update/delete, category create/update/delete, thread approve/delete/lock/sticky/move/copy, plugin enable/disable/delete, theme activate/delete, and settings changes.

## Authentication Hardening

- **Session lifecycle**: Sessions are regenerated on login. Privilege changes (role update) are reflected immediately in the session.
- **Token security**: Email verification and password reset tokens are stored as SHA-256 hashes (never raw). Tokens expire after 24 hours (email) or 1 hour (reset) and are single-use.
- **Account enumeration prevention**: Login errors are generic ("Invalid credentials") — they don't reveal whether the username exists.
- **CSRF protection**: Tokens rotate on every successful validation via `csrf_validate_request()`. Use `csrf_validate_request()` in all POST handlers.
- **Rate limiting**: Login (5/15min), register (5/hr), forgot-password (5/hr), reset-password (10/hr) are rate-limited per client IP.

## Content Hardening

- **Markdown fuzzing**: Tested against nested markdown, Unicode normalization, very long input (15000+ chars), malformed tags, attribute breakout vectors.
- **Upload validation**: Extension whitelist, MIME type verification, size limits, content validation. Uploaded files use generated IDs (not user-supplied names).
- **Plugin manifest validation**: v1 schema validated at install time — missing name, invalid ID format, incompatible core/PHP versions, and unmet dependencies are rejected.

## Reporting

If you encounter a malicious or problematic plugin/theme, report it on the official forum: **www.bulletinbored.net/forum**.
