---
title: Security Model
description: Trust model, known risks, and hardening options for bulletinbored.
---
# Security Model

bulletinbored is built for a **single trusted administrator** who installs plugins, themes, language packs, and updates. The security model therefore assumes that installing code is a deliberate act of trust in its source (the author / the repository).

## What is hardened

- **Zip Slip is mitigated everywhere a package is extracted.** `PluginManager`, `ThemeManager`, `UpdateManager`, and the shared `extract_zip()` all validate every archive entry and reject `..` path traversal and absolute paths before writing.
- **Repository and package installs are non-destructive.** Installing or updating a plugin/theme from a ZIP or a Git repository never deletes the working version before the replacement is validated. The new package is downloaded to a staging directory (`ZIP` extracted through `PackageInstaller`; repositories cloned/downloaded through `install_repo_package()`) and validated with the same checks — manifest plus core/PHP constraints and, when the per-type verify toggle is enabled, the `files` integrity list. Only then is the existing directory moved to `_old_{name}_{uniqid}` and the staged package swapped in; the backup is discarded only on success. On any failure the backup (and for plugins the previous `installed.json` record) is restored. Package names derived from external input (`expectedName`, `name`) are validated against `^[a-z0-9][a-z0-9_-]*$` before they are used to build a path under `plugins/` or `themes/`.
- **Package rollback is filesystem-only.** When a plugin install/update fails after a lifecycle hook (`on_install` / `on_update`) has run, the previous files and metadata are restored, but database changes made by that hook are **not** automatically reverted. Plugin authors must keep migrations idempotent or revert them explicitly.
- **Language packs are JSON only — no `eval()`.** Uploaded or installed translation files are parsed as plain JSON data. PHP language files are no longer supported, eliminating the supply-chain RCE vector.
- **TLS verification is enforced.** All update downloads (core, plugins, themes) verify the server certificate with `CURLOPT_SSL_VERIFYPEER=true` and `CURLOPT_SSL_VERIFYHOST=2`. When cURL is unavailable and the code falls back to `file_get_contents()`, the stream context explicitly sets `verify_peer` / `verify_peer_name` to `true` and `allow_self_signed` to `false`, so the fallback never silently weakens TLS.
- **Attachment authorization.** `/download/{id}` verifies `can_view_thread()` before serving files. Attachments belonging to hidden/pending threads are protected by the same policy as the thread itself. Uploads are linked to threads via `thread_id` or indirectly via `post_id` (looking up the thread through the post). Orphan uploads (with no thread association) and uploads whose thread is not viewable return `404 Not Found` for **every** user, so their existence is not disclosed.
- **Plugin dependency graph.** Circular dependencies are detected and rejected. Disabling a plugin recursively disables all plugins that depend on it.
- **Core update aborts if backup fails.** The updater no longer proceeds without a safety net — if the backup step fails, the update is aborted.
- **Application state centralized where practical.** The `App` class is the primary container for config, PDO, AuthZ, i18n and the managers, but some legacy global access remains: the exception handler reads `$GLOBALS['config']` (`src/bootstrap.php:145`), `views/header.php` reads `$GLOBALS['config']` and `$GLOBALS['pluginManager']`, and `AuthZ` looks up the plugin permission hook through `global $pluginManager` (`lib/AuthZ.php:85`). This reduces, rather than eliminates, hidden coupling.
- **CSP tightened.** Scripts and styles require a nonce (`script-src` and `style-src` both include `'nonce-{nonce}'`). `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'` are enforced. Stylesheets are otherwise restricted to `style-src 'self'` plus the CDN allow-list; inline `style="…"` attributes are permitted via `style-src-attr 'unsafe-inline'` (needed for dynamic values like avatars and progress bars), while injected `<style>` blocks remain blocked. The fallback avatar is rendered as an inline `<svg>` and needs no inline style at all.
- **TrustedProxies IPv6 support.** The trusted proxy detection now supports IPv6 addresses and CIDR notation.
- **`shell_exec()` removed.** Git detection in diagnostics and repo_install now uses `exec()` with return code checking instead of `shell_exec()`.
- **Code modularized.** `helpers.php` fully split into `src/Helpers/` (Url, AuthHelpers, Upload, Mail, Notifications, Text, Avatar, Data). `posts.php` split into `posts-thread.php`, `posts-new.php`, `posts-edit.php`. Handlers use `App::getInstance()` instead of `global $pdo`, and PluginManager and ThemeManager i18n uses `App::getInstance()->i18n`. This reduces file complexity and most global state coupling, though a few legacy globals remain (see the application state note above).
- **Test coverage.** Regression tests verify: no `eval()` in source files, SSL verification never disabled, download requires thread access (functional tests for guest/moderator/user on hidden/pending/visible threads, orphan uploads, and post_id-based thread association). Syntax check test validates all source files via `php -l`.
- **No trust in raw user HTML.** The core renders **Markdown only**. `bb_parse_inline()` HTML-escapes all text before matching Markdown tokens (`src/markdown.php:30-34`), and `bb_parse_markdown()` only emits tags generated from recognised syntax, so pasted HTML is shown as literal text (`src/markdown.php:12-13`). `bb_render_content()` is the single rendering path; a plugin can replace it through the `render_content` hook (`src/markdown.php:195-219`). There is no `sanitize_html()` function and no raw-HTML sanitizer to configure. Output is served under a per-request nonce-based CSP.
- **Query hardening.** `fetch_threads()` uses whitelist + placeholders for status filter instead of string interpolation.
- **Installer files do not re-appear after a core update.** `applyCoreUpdate()` removes only the setup wizards `install.php`, `install2.php`, and `install3.php` from a deployed root once the forum is installed (`config.json` present); on a fresh install (no `config.json`) they are kept so setup can run. `api/install.php` is deliberately **not** removed (`lib/UpdateManager.php:884-903`): it is a runtime admin endpoint for catalog installs. It boots without `src/bootstrap.php`, so it resolves the administrator against the database with `AdminAuth::connect()` / `AdminAuth::verifySession()`, requires a CSRF token, and is rate-limited to 20 requests per hour (`api/install.php:44-67`).
- **CSRF tokens rotate on every successful validation.** Each POST request validates the token and immediately issues a new one, preventing replay attacks. Use `csrf_validate_request()` in POST handlers. All state-changing operations (including watch/unwatch/logout) use POST with CSRF protection.
- **Input sanitization is centralized.** The `Bulletin\Request` class provides a single entry point for all user input (`get()`, `post()`, `input()`), ensuring consistent sanitization and eliminating the risk that a new handler forgets to escape input.
- **Most admin actions are audit-logged.** User create/update/delete/ban/unban/suspend/disconnect, role changes, category changes, thread moderation (approve/hide/delete/lock/sticky/move/copy), and plugin/theme management are logged to `data/logs/security.log` with admin identity, IP, timestamp, and context. Settings, SMTP, site image, catalog, and language changes are **not** currently written to the admin audit log (`src/actions/admin/settings.php`, `catalog.php`, `langs.php`).
- **Secrets and CLI/dev files are never served.** `config.json`, `config.php`, `bb.php` and `router.php` are denied on Apache (`.htaccess`), Nginx (`nginx.conf`), IIS (`web.config`) and the PHP built-in server (`router.php`). The built-in server only serves allow-listed static asset extensions and blocks `data/` and `uploads/private/`.
- **The installer is hardened.** All three steps enforce CSRF tokens, the re-run guard fails closed (a `config.json` with a `db_driver` is authoritative even if the DB is unreachable), and the SQLite `db_path` is confined to the application directory before any file/`mkdir()` is created. Failures are logged server-side, not echoed. It also **refuses to reuse an existing, populated database when no `config.json` is present**, so a "fresh" install can never silently present the previous forum's threads and users; the message explains how to migrate a forum instead.
- **Rate limiting covers all mutations.** Beyond auth/posting, the file-based limiter throttles edit/delete, watch/unwatch, image and avatar uploads, profile edits, and every admin operation. Sensitive actions (authentication, account changes, destructive content operations and all admin actions) **fail closed**: if the bucket cannot be opened, the lock cannot be acquired, the stored data is corrupt, or the updated hit cannot be persisted, the request is denied rather than allowed. Only non-sensitive actions degrade open. Stale buckets (>24 h) are removed opportunistically so `data/ratelimit/` does not grow without bound.
- **Client IP behind proxies.** When the request comes from a configured trusted proxy, the client IP is taken as the **first valid** `X-Forwarded-For` value. Deployments that chain several proxies must list every hop in `trusted_proxies` and make sure the front proxy normalises/appends the header; the parser does not attempt to reconstruct an arbitrary chain.
- **Response headers.** Every response sets `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` and `Permissions-Policy`; `Strict-Transport-Security` is sent over HTTPS.
- **Download filename sanitization.** `Content-Disposition` strips control characters and uses an RFC 5987 encoded filename, preventing header injection from user-supplied upload names.
- **Plugin JSON APIs do not leak internals.** `bellbored` and `textmebored` return a generic `internal_error` and log the exception server-side.
- **Telemetry is anonymous, opt-out and non-identifying.** The daily heartbeat sends only a random `install_id`, the core and PHP versions, the database driver, plugin/theme counts and the language. No IP address, domain, user data, posts or content is ever transmitted or stored. It can be disabled with `"telemetry": false` in `config.json` or via **Admin → Settings → "Send anonymous statistics"**, after which **no network request is made**. See [Configuration](configuration#telemetry).

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
| `allow_catalog_only` | `true` | When `true`, only `official: true` catalog entries can be installed. The settings UI enables it by default too (`views/admin_settings.php:167`). |
| `allow_prerelease_updates` | `false` | Offer prerelease core/extension updates. A prerelease may also follow the next prerelease. |
| `hsts_max_age` | `31536000` | `Strict-Transport-Security` max-age in seconds, sent over HTTPS. `0` disables HSTS. |
| `hsts_include_subdomains` | `false` | Add `includeSubDomains` to the HSTS header. Opt-in because it also binds every subdomain to HTTPS. |
| `rate_limit_multiplier` | `1` | Global multiplier for the request allowance of every rate limit (`0.1` to `10`; clamps in `src/Security.php:183-193`). `1` keeps the documented limits. |
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
| `threads.split` / `threads.merge` / `threads.copy` | Split/merge/copy threads |
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
| `langs.manage` | Manage language files |

## Admin Audit Log

All state-changing admin actions are logged to `data/logs/security.log`:

```
[2026-08-29T16:00:00+02:00] admin_user_ban ip=127.0.0.1 {"admin_id":1,"admin_user":"admin","target_id":42}
```

Logged actions include: user create/update/delete/ban/unban/suspend/disconnect, role create/update/delete, category create/update/delete, thread approve/hide/delete/lock/sticky/move/copy, plugin enable/disable/delete, and theme activate/delete. Settings, SMTP, site image, catalog, and language changes are not written to the admin audit log.

## Authentication Hardening

- **Session lifecycle**: Sessions are regenerated on login. Role and status changes bump `users.session_version`, so the new privileges are **not** picked up by the existing session: the next `is_logged_in()` check invalidates it and the affected account must log in again (`src/actions/admin/users.php:82-97`).
- **Token security**: Email verification and password reset tokens are stored as SHA-256 hashes (never raw). Tokens expire after 24 hours (email) or 1 hour (reset) and are single-use.
- **Account enumeration prevention**: Login errors are generic ("Invalid credentials") — they don't reveal whether the username exists.
- **CSRF protection**: Tokens rotate on every successful validation via `csrf_validate_request()`. Use `csrf_validate_request()` in all POST handlers.
- **Rate limiting**: Login (5/15min), register (5/hr), forgot-password (5/hr), reset-password (10/hr) are rate-limited per client IP. Auth actions fail-closed (denied) when rate limit is exceeded.
- **Uncaught exceptions are contained**: a global handler in `src/bootstrap.php` logs the error and returns a generic `500` (JSON for API/JSON requests) instead of a raw fatal error, so internal paths and messages are not disclosed when `display_errors` is enabled.

## New Security Fixes

### Attachment Access Control

Attachments in hidden/pending threads are now protected:
- Files stored in `uploads/private/` instead of `uploads/`
- Download endpoint `/download/{id}` checks `can_view_thread()` before serving
- `.htaccess` in `uploads/private/` denies all direct access (Apache)
- `nginx.conf` uses `location ^~ /uploads/private/ { deny all; }` (Nginx)
- Orphan uploads (no thread association) and non-viewable threads return `404` for all users
- Uploads record their `thread_id`/`post_id` before the file is moved, and the context is validated up front
- The private uploads directory is created and given a deny-all `.htaccess` by `ensure_private_uploads_dir()` (called from `src/setup.php` on every request and before each upload), so the protection exists on a fresh deployment and does not depend on a runtime directory being present

### SMTP Injection Prevention

`send_email()` validates email addresses with `FILTER_VALIDATE_EMAIL` and rejects any headers containing `\r` or `\n` (CRLF injection prevention).

### Session Invalidation

- `session_version` column added to users table
- `is_logged_in()` verifies the session version against the database and invalidates the session when it is missing, stale, or the user row no longer exists (deleted account) (`src/Helpers/AuthHelpers.php:22-72`)
- Password reset increments the version, invalidating old sessions
- A role or status change in the admin user editor increments the version (`src/actions/admin/users.php:82-97`)
- Ban, unban, and suspend increment the version (`src/actions/admin/users.php`)
- **Legacy sessions** (created before the `session_version` migration) are rejected because they have no stored version
- `POST /logout-others` increments the current user's version and refreshes only this device, signing out every other device (`index.php:163`, `src/actions/users.php:213`)
- `POST /admin/disconnect-user` increments another non-admin user's version without changing the account (`index.php:210`, `src/actions/admin/users.php:195`)
- Deleted accounts are rejected on the next request (`src/Helpers/AuthHelpers.php:54-57`)

### Watch/Unwatch Hidden Thread Protection

`handle_watch()` and `handle_unwatch()` now validate thread visibility before performing watch/unwatch operations. Users cannot watch or unwatch hidden/pending threads they cannot view, preventing information leakage about thread existence.

### Host Header URL Generation

Absolute URLs now use configured `base_url` instead of `$_SERVER['HTTP_HOST']`, preventing host header injection via spoofed headers.

### PluginManager Hook Fix

Hook callbacks now use `return false` instead of `continue`, ensuring hooks don't accidentally skip subsequent handlers.

## Content Hardening

- **Markdown fuzzing**: Tested against nested markdown, Unicode normalization, very long input (15000+ chars), malformed tags, attribute breakout vectors.
- **Upload validation**: Extension whitelist, MIME type verification, size limits, content validation. Uploaded files use generated IDs (not user-supplied names).
- **Plugin manifest validation**: v1 schema validated at install time — missing name, invalid ID format, incompatible core/PHP versions, and unmet dependencies are rejected.

## Reporting

If you encounter a malicious or problematic plugin/theme, report it on the official forum: **www.bulletinbored.net/forum**.
