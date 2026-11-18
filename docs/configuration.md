---
title: Configuration
description: Database, email, themes, localization, and update server settings.
---
# Configuration

Edit `config.json` to customize your installation.

```json
{
    "db_driver": "sqlite",
    "db_path": "/var/www/bulletinbored/data/database.sqlite",
    "sqlite_busy_timeout": 60000,
    "db_host": "localhost",
    "db_name": "forum",
    "db_user": "root",
    "db_pass": "",

    "site_name": "bulletinbored",
    "admin_user": "admin",

    "mail_from": "noreply@yourdomain.com",
    "mail_from_name": "bulletinbored",
    "mail_method": "mail",

    "theme": "freshbored",

    "avatar_max_size": 2097152,
    "avatar_allowed_types": ["image/jpeg", "image/png", "image/gif", "image/webp"],

    "base_url": "",
    "force_https": true,
    "hsts_max_age": 31536000,
    "hsts_include_subdomains": false,
    "cookie_secure": true,
    "email_notifications": true,
    "version": "1.0.0",
    "plugin_manifest": "/var/www/bulletinbored/data/plugins.json",
    "theme_manifest": "/var/www/bulletinbored/data/themes.json",
    "update_manifest": "/var/www/bulletinbored/data/updates.json",
    "update_server": "https://github.com/bulletinbored/bulletinbored-core",
    "update_mirror": "https://extend.bulletinbored.net",
    "allow_prerelease_updates": false,
    "allow_catalog_only": true,
    "rate_limit_multiplier": 1,
    "trusted_proxies": ["127.0.0.1", "::1"],

    "install_id": "",
    "telemetry": true,
    "telemetry_url": "https://www.bulletinbored.net/heartbeat.php"
}
```

`db_path` and the `*_manifest` paths must be real absolute paths: the runtime does not expand `__DIR__`. The example above uses `/var/www/bulletinbored`; replace it with your installation path. When you use the web installer it resolves the database path for you and writes the server path to `config.json`.

## Version

The application reads `version` from `config.json` at boot. Do not edit it by hand: the installer and the updater write it from the `VERSION` file. See [Versioning](versioning) for how to manage releases.

## Database

SQLite requires no additional setup. The database file is created automatically at the path set in `db_path`.

`sqlite_busy_timeout` is the lock wait in milliseconds for concurrent SQLite writers (`lib/BbPdo.php`). The sample uses `60000` (60 seconds); lowering it makes writers fail earlier with "database is locked". When omitted, the PDO driver default applies.

### MySQL

To use MySQL, set:

```json
"db_driver": "mysql",
"db_host": "localhost",
"db_name": "forum",
"db_user": "root",
"db_pass": ""
```

The schema is migration-driven: `src/setup.php` runs pending migrations from `migrations/` on boot, and those migrations create the tables and seed defaults. See [CLI & Migrations](cli-migrations).

## Email

The forum uses PHP's `mail()` function by default. For SMTP support, set:

```json
"mail_method": "smtp",
"mail_host": "smtp.example.com",
"mail_port": 587,
"mail_username": "user@example.com",
"mail_password": "secret",
"mail_secure": "tls",
"mail_timeout": 10,
"mail_require_tls_for_auth": true
```

| Key | Default | Effect |
|---|---|---|
| `mail_secure` | `""` | Encryption for SMTP: empty, `tls` (STARTTLS), or `ssl`. |
| `mail_timeout` | `10` | Socket timeout in seconds (`src/Helpers/Mail.php`). |
| `mail_require_tls_for_auth` | `false` | When `true`, refuse to send SMTP credentials over an unencrypted connection. |

## Notifications

Notification e-mails for replies and mentions are sent by default. Set:

```json
"email_notifications": false
```

to keep in-app notifications only (no e-mail). This does not affect
registration/verification or password-reset e-mails.

## Telemetry

bulletinbored can send an anonymous daily "heartbeat" so the project can count
**active installations**. It is **opt-out** (enabled by default).

```json
"install_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
"telemetry": true,
"telemetry_url": "https://www.bulletinbored.net/heartbeat.php"
```

| Key | Default | Effect |
|---|---|---|
| `install_id` | generated at install | Random UUID identifying the installation. Not derived from your domain, users or IP. An installation upgraded from a release without it generates one on the first heartbeat. |
| `telemetry` | `true` | Set to `false` to disable the heartbeat entirely — no network request is made. Also switchable in **Admin → Settings → "Send anonymous statistics"**. |
| `telemetry_url` | bulletinbored collector | Collector endpoint. Change it only if you host your own collector. |

The payload contains only the `install_id`, core version, PHP version, database
driver, plugin/theme counts and the active language. **No IP address, domain,
user data, posts or content are ever sent.** The request runs fire-and-forget
with a short timeout, at most once per day, and every failure is ignored, so it
never slows down or breaks the forum. See the [Security Model](security) for the
privacy rationale.

## HTTPS

`force_https` (default `true`) redirects plain-HTTP requests to HTTPS. Disable
it only on hosts without a valid certificate, or during local development:

```json
"force_https": false
```

`cookie_secure` (default `true`) marks the session cookie `Secure`; keep it on
for HTTPS deployments. Behind a reverse proxy that terminates TLS, forward
`X-Forwarded-Proto` (see [Installation](installation)).

`hsts_max_age` (default `31536000` seconds) controls the `Strict-Transport-Security`
max-age; set it to `0` to disable HSTS entirely. `hsts_include_subdomains`
(default `false`) is opt-in and applies HSTS to every subdomain, so enable it
only when all subdomains have valid certificates (`src/csp.php`).

`trusted_proxies` (default `["127.0.0.1", "::1"]`) lists the proxy addresses
whose `X-Forwarded-*` headers are trusted. Entries may be plain IPv4/IPv6
addresses or CIDR ranges (`src/TrustedProxies.php`).

## Theme

Set the active theme by folder name:

```json
"theme": "freshbored"
```

## Localization

Configure the default language and available languages:

```json
"default_lang": "en",
"available_langs": ["en", "it"]
```

## Settings saved from the admin panel

These keys are written to `config.json` by **Admin → Settings** (`src/actions/admin/settings.php`). They are absent from the sample and keep their fallback when missing:

| Key | Default when absent | Effect |
|---|---|---|
| `attachments_enabled` | off | Enables file attachments in the new-thread form. |
| `site_logo` | empty | URL or path of the header logo; also embedded in outgoing e-mail. |
| `site_favicon` | empty | URL or path of the favicon. |
| `notify_admin_email` | empty | Address that receives admin notification e-mails. |

## Rate Limiting (Security Hardening)

Sensitive actions are throttled by a dependency-free, file-based rate limiter (`rate_limit()` in `src/Security.php`). Each `(action, key)` bucket keeps a sliding window of timestamps in `data/ratelimit/{bucket}.json`. The default limits applied in `src/actions/` handlers are:

| Action | Max attempts | Window | Bucket key |
|---|---|---|---|
| `login` | 5 | 900s (15 min) | IP |
| `register` | 5 | 3600s (1 h) | IP |
| `forgot_password` | 5 | 3600s (1 h) | IP |
| `reset_password` | 10 | 3600s (1 h) | IP |
| `new_thread` | 20 | 3600s (1 h) | user id (0 if guest) |
| `reply` | 30 | 3600s (1 h) | user id (0 if guest) |
| `edit_post` / `edit_thread` | 30 / 20 | 3600s (1 h) | user id |
| `delete_post` / `delete_thread` | 20 / 10 | 3600s (1 h) | user id |
| `watch` / `unwatch` | 30 | 3600s (1 h) | user id |
| `upload_image` / `editbored_upload` | 20 | 3600s (1 h) | user id |
| `edit_profile` / `remove_avatar` | 20 | 3600s (1 h) | user id |
| `logout_others` | 5 | 3600s (1 h) | user id |
| `admin_disconnect_user` | 20 | 3600s (1 h) | user id |
| Admin actions (settings, catalog, categories, languages, moderation, plugins, themes, updates, roles, users) | 10–30 | 3600s (1 h) | user id |

These per-action limits are scaled by `rate_limit_multiplier` (default `1`),
which lets an administrator tighten or relax every limit at once without
editing handlers. The value is clamped between `0.1` and `10`, and the
resulting maximum is at least `1` (`src/Security.php`).

The `data/ratelimit/` directory is created automatically. Sensitive actions
fail closed (denied) when the limiter cannot open the bucket, acquire its lock,
parse it, or persist the updated hit (disk full / read-only file). Buckets older
than 24 hours are removed opportunistically by `rate_limit_gc()` so the
directory does not grow without bound.

## Security Hardening

bulletinbored trusts its administrator to install code (plugins, themes, language packs, updates). The following options harden that trust boundary; see the [Security Model](security) for the full threat model.

```json
"plugin_verify_files": true,
"theme_verify_files": true,
"allow_catalog_only": true
```

| Key | Default | Effect |
|---|---|---|
| `plugin_verify_files` | `true` | When installing a plugin from a ZIP, reject the package if its extracted files do not match the `files` list declared in `manifest.json` (catches dropped-in/backdoor files). Plugins without a `files` key are skipped. |
| `theme_verify_files` | `true` | Same integrity check for themes. |
| `allow_catalog_only` | `true` | When `true`, only catalog entries marked `official: true` may be installed. This narrows the trusted source surface but does **not** pre-approve updates, since a curated source can still publish a new version at any time (see [Security Model](security)). |

Disabling a `*_verify_files` check weakens tamper detection and is not recommended
on a production forum with untrusted users.

## Updates

Configure an update server if you want automatic update checking:

```json
"update_server": "https://github.com/bulletinbored/bulletinbored-core",
"update_mirror": "https://extend.bulletinbored.net",
"allow_prerelease_updates": false
```

If `update_server` points to a GitHub repository, the Update Manager uses the GitHub Releases API automatically and no additional server setup is required. GitHub's `/releases/latest` endpoint skips prereleases.

`versions.json` is fetched from `update_mirror`, not from `update_server` (`lib/UpdateFetcher.php`). For non-GitHub servers, point `update_mirror` at the server that exposes `versions.json`. See [Update Manager](managers#update-manager) for details.

Set `allow_prerelease_updates` to `true` to be offered prereleases such as `1.0.0-rc.1`. A stable installation never receives one unless this key is enabled; an installation already running a prerelease may follow the next prerelease. See [Versioning](versioning).

### GitHub token

GitHub API has a rate limit of 60 requests/hour for unauthenticated requests. If you expect many update checks, you can provide a GitHub personal access token to raise the limit to 5000 requests/hour:

```json
"github_token": "ghp_xxxxxxxxxxxx"
```

The token must have the `public_repo` scope. Create one at https://github.com/settings/tokens

> **Security**: never commit `github_token` to a public repository. Store it in an environment variable or a file outside version control.