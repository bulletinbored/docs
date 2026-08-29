---
title: Configuration
description: Database, email, themes, localization, and update server settings.
---
# Configuration

Edit `config.json` to customize your installation.

```json
{
    "db_driver": "sqlite",
    "db_path": "__DIR__/data/database.sqlite",
    "db_host": "localhost",
    "db_name": "forum",
    "db_user": "root",
    "db_pass": "",

    "site_name": "bulletinbored",
    "admin_user": "admin",
    "admin_pass": "changeme123",

    "mail_from": "noreply@yourdomain.com",
    "mail_from_name": "bulletinbored",
    "mail_method": "mail",

    "theme": "freshbored",

    "avatar_max_size": 2097152,
    "avatar_allowed_types": ["image/jpeg", "image/png", "image/gif", "image/webp"],

    "base_url": "",
    "version": "0.5.0",
    "plugin_manifest": "__DIR__/data/plugins.json",
    "theme_manifest": "__DIR__/data/themes.json",
    "update_manifest": "__DIR__/data/updates.json",
    "update_server": "",
    "update_mirror": ""
}
```

## Version

Do not hardcode the version; the application reads it from the `VERSION` file at the project root, e.g. `0.5.0`. See [Versioning](versioning) for how to manage releases.

## Database

SQLite requires no additional setup. The database file is created automatically in `data/database.sqlite`.

### MySQL

To use MySQL, set:

```json
"db_driver": "mysql",
"db_host": "localhost",
"db_name": "forum",
"db_user": "root",
"db_pass": ""
```

Tables are created automatically on first access.

## Email

The forum uses PHP's `mail()` function by default. For SMTP support, set:

```json
"mail_method": "smtp",
"mail_host": "smtp.example.com",
"mail_port": 587,
"mail_username": "user@example.com",
"mail_password": "secret"
```

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

## Rate Limiting (Security Hardening)

Sensitive actions are throttled by a dependency-free, file-based rate limiter (`rate_limit()` in `src/helpers.php`). Each `(action, key)` bucket keeps a sliding window of timestamps in `data/ratelimit/{bucket}.json`. The default limits applied in `src/actions/` handlers are:

| Action | Max attempts | Window | Bucket key |
|---|---|---|---|
| `login` | 5 | 900s (15 min) | IP |
| `register` | 5 | 3600s (1 h) | IP |
| `forgot_password` | 5 | 3600s (1 h) | IP |
| `reset_password` | 10 | 3600s (1 h) | IP |
| `new_thread` | 20 | 3600s (1 h) | user id (0 if guest) |
| `reply` | 30 | 3600s (1 h) | user id (0 if guest) |

The `data/ratelimit/` directory is created automatically. No configuration is required; the limits are hard-coded in the action handlers.

## Security Hardening

bulletinbored trusts its administrator to install code (plugins, themes, language packs, updates). The following options harden that trust boundary; see the [Security Model](security) for the full threat model.

```json
"plugin_verify_files": true,
"theme_verify_files": true,
"allow_catalog_only": false
```

| Key | Default | Effect |
|---|---|---|
| `plugin_verify_files` | `true` | When installing a plugin from a ZIP, reject the package if its extracted files do not match the `files` list declared in `manifest.json` (catches dropped-in/backdoor files). Plugins without a `files` key are skipped. |
| `theme_verify_files` | `true` | Same integrity check for themes. |
| `allow_catalog_only` | `false` | When `true`, only catalog entries marked `official: true` may be installed. This narrows the trusted source surface but does **not** pre-approve updates — a curated source can still publish a new version at any time (see [Security Model](security)). |

Disabling a `*_verify_files` check weakens tamper detection and is not recommended
on a production forum with untrusted users.

## Updates

Configure an update server if you want automatic update checking:

```json
"update_server": "https://github.com/bulletinbored/bulletinbored-core"
```

If `update_server` points to a GitHub repository, the Update Manager uses the GitHub Releases API automatically and no additional server setup is required.

For non-GitHub servers, the server must expose a `versions.json` file. See [Update Manager](managers#update-manager) for details.

### GitHub token

GitHub API has a rate limit of 60 requests/hour for unauthenticated requests. If you expect many update checks, you can provide a GitHub personal access token to raise the limit to 5000 requests/hour:

```json
"github_token": "ghp_xxxxxxxxxxxx"
```

The token must have the `public_repo` scope. Create one at https://github.com/settings/tokens

> **Security**: never commit `github_token` to a public repository. Store it in an environment variable or a file outside version control.