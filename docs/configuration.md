---
title: Configuration
description: Database, email, themes, localization, and update server settings.
---
# Configuration

Edit `config.php` to customize your installation.

```php
$config = [
    // Database
    'db_driver' => 'sqlite',          // 'sqlite' or 'mysql'
    'db_path' => __DIR__.'/data/database.sqlite',
    'db_host' => 'localhost',
    'db_name' => 'forum',
    'db_user' => 'root',
    'db_pass' => '',
    
    // Site
    'site_name' => 'bulletinbored',
    'admin_user' => 'admin',
    'admin_pass' => 'changeme123',
    
    // Email (for password reset, notifications)
    'mail_from' => 'noreply@yourdomain.com',
    'mail_from_name' => 'bulletinbored',
    'mail_method' => 'mail',          // 'mail' for PHP mail(), 'smtp' for SMTP
    
    // Theme
    'theme' => 'freshbored',              // Theme name (folder in themes/)
    
    // Uploads
    'avatar_max_size' => 2 * 1024 * 1024, // 2MB
    'avatar_allowed_types' => ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    
    // URL
    'base_url' => '', // Leave empty for auto-detection, or set to '/forum-nuovo'
    'version' => trim(file_get_contents(__DIR__.'/VERSION')),
    'plugin_manifest' => __DIR__.'/data/plugins.json',
    'theme_manifest' => __DIR__.'/data/themes.json',
    'update_manifest' => __DIR__.'/data/updates.json',
    'update_server' => '', // Remote update server URL (empty to disable)
    'update_mirror' => '', // Static mirror base URL for language files (empty = default extend.bulletinbored.net)
];
```

## Version

Do not hardcode the version; the application reads it from the `VERSION` file at the project root, e.g. `0.1.0`. See [Versioning](versioning) for how to manage releases.

## Database

SQLite requires no additional setup. The database file is created automatically in `data/database.sqlite`.

### MySQL

To use MySQL, set:

```php
'db_driver' => 'mysql',
'db_host' => 'localhost',
'db_name' => 'forum',
'db_user' => 'root',
'db_pass' => '',
```

Tables are created automatically on first access.

## Email

The forum uses PHP's `mail()` function by default. For SMTP support, set:

```php
'mail_method' => 'smtp',
'mail_host' => 'smtp.example.com',
'mail_port' => 587,
'mail_username' => 'user@example.com',
'mail_password' => 'secret',
```

## Theme

Set the active theme by folder name:

```php
'theme' => 'freshbored',
```

## Localization

Configure the default language and available languages:

```php
'default_lang' => 'en',
'available_langs' => ['en', 'it'],
```

## Rate Limiting (Security Hardening)

Sensitive actions are throttled by a dependency-free, file-based rate limiter
(`rate_limit()` in `src/helpers.php`). Each `(action, key)` bucket keeps a sliding
window of timestamps in `data/ratelimit/{bucket}.json`. The default limits applied
in `src/actions.php` are:

| Action | Max attempts | Window | Bucket key |
|---|---|---|---|
| `login` | 5 | 900s (15 min) | IP |
| `register` | 5 | 3600s (1 h) | IP |
| `forgot_password` | 5 | 3600s (1 h) | IP |
| `reset_password` | 10 | 3600s (1 h) | IP |
| `new_thread` | 20 | 3600s (1 h) | user id (0 if guest) |
| `reply` | 30 | 3600s (1 h) | user id (0 if guest) |

The `data/ratelimit/` directory is created automatically. No configuration is
required; the limits are hard-coded in the action handlers.

## Updates

Configure an update server if you want automatic update checking:

```php
'update_server' => 'https://github.com/bulletinbored/bulletinbored-core',
```

If `update_server` points to a GitHub repository, the Update Manager uses the GitHub Releases API automatically and no additional server setup is required.

For non-GitHub servers, the server must expose a `versions.json` file. See [Update Manager](managers#update-manager) for details.

### GitHub token

GitHub API has a rate limit of 60 requests/hour for unauthenticated requests. If you expect many update checks, you can provide a GitHub personal access token to raise the limit to 5000 requests/hour:

```php
'github_token' => 'ghp_xxxxxxxxxxxx',
```

The token must have the `public_repo` scope. Create one at https://github.com/settings/tokens

> **Security**: never commit `github_token` to a public repository. Store it in an environment variable or a file outside version control.