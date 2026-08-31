---
title: Managers
description: bulletinbored documentation
---
# Managers

## Authorization (`AuthZ`)

The `AuthZ` service (`lib/AuthZ.php`) centralizes all authorization checks. Permissions use `resource.action` notation (e.g., `posts.edit`, `threads.delete_own`):

```php
$authz = new AuthZ($pdo);

// Check if user has a permission
$authz->can($userId, 'posts.edit');

// Check with ownership (uses "permission_own" variant for owners)
$authz->canOnOwned($userId, 'posts.edit', $ownerId);

// Get user role
$authz->getUserRole($userId);

// Get role permissions
$authz->getRolePermissions('moderator');

// Check if user has a specific role
$authz->hasRole($userId, 'admin');
```

The `admin` middleware and `can:permission` middleware in `src/Router.php` both delegate to `AuthZ`, so admin routes require `admin.access` and `can:foo.bar` routes require the `foo.bar` permission.

### Canonical Permission Registry

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
| `threads.copy` | Copy thread |
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
| `langs.manage` | Language file management |

## Plugin Manager (`admin_plugins`)

The Plugin Manager lists all discovered plugins, shows their metadata (name, version, author, description), and allows enabling/disabling them from the admin panel.

- Plugins are PHP files or folders in `plugins/`
- Metadata is parsed from the file header:
  ```php
   /**
    * Plugin Name: MyPlugin
    * Version: 1.0.0
    * Author: Developer
    * Description: Example plugin
    */
   function myplugin_init() {
       // your code
   }
  ```
- Plugin state is stored in `data/plugins.json`
- Install plugins directly from the dashboard by uploading a ZIP file containing one or more PHP plugin files
- Delete plugins directly from the dashboard

## Hook System

Plugins can register callbacks that run when the core fires specific events. Three hook types are available:

- **Actions** (`runHook`): Side effects only. All callbacks fire in priority order.
- **Filters** (`filter`): Transform a value through a chain of callbacks.
- **Checks** (`checkHook`/`checkHookAll`): Permission/veto gates.

```php
function myplugin_init() {
    global $pluginManager;

    // Action: react to new posts
    $pluginManager->addHook('post_after_create', function($postId, $data, $thread) {
        // send notification, update stats, ...
    });

    // Filter: modify thread data before save
    $pluginManager->addHook('thread_before_create', function(array $data): array {
        $data['title'] = trim($data['title']);
        return $data;
    });

    // Check: veto deletion
    $pluginManager->addHook('thread_delete_block', function(array $thread): bool {
        return $thread['reply_count'] > 100; // prevent deletion of popular threads
    });
}
```

### Hook Priority

Lower priority number = earlier execution. Default is 10:

```php
$pluginManager->addHook('post_after_create', $callback, 5);  // runs first
$pluginManager->addHook('post_after_create', $callback, 15); // runs later
```

### Core Events Currently Wired

**CRUD — Threads:** `thread_before_create`, `thread_after_create`, `thread_create_block`, `thread_before_update`, `thread_after_update`, `thread_before_delete`, `thread_after_delete`, `thread_delete_block`

**CRUD — Posts:** `post_before_create`, `post_after_create`, `post_create_block`, `post_before_update`, `post_after_update`, `post_before_delete`, `post_after_delete`, `post_delete_block`

**Rendering:** `thread_before_view`, `thread_posts_before_view`, `thread_before_render`, `thread_after_render`, `thread_not_found`, `before_render`, `frontend_before_render`, `admin_before_render`, `footer_before_render`, `render_content`

**Auth:** `auth_before_verify`, `auth_login_block`, `auth_after_login`, `auth_login_failed`

**Permissions:** `permission_{name}` (dynamic, e.g. `permission_posts.edit`)

**Users:** `user_registered`

## Theme Manager (`admin_themes`)

The Theme Manager discovers all themes in `themes/`, tracks the active theme, and provides CSS URLs/paths.

- Themes are subdirectories in `themes/` containing a `style.css`
- Optional `manifest.json` for metadata:
  ```json
  {
      "name": "My Theme",
      "version": "1.0.0",
      "author": "Author Name",
      "description": "Theme description"
  }
  ```
- Theme state is stored in `data/themes.json`
- Switch themes from **Admin Panel → Themes**
- Install themes directly from the dashboard by uploading a ZIP file containing a folder with `style.css` and optional `manifest.json`
- Delete themes directly from the dashboard (default theme is protected)

## Language Manager (`admin_langs`)

The Language Manager lets you upload and delete localization JSON files from the dashboard, and keeps them in sync with a static language mirror.

- Upload a file by choosing a language code (e.g. `fr`) and selecting a JSON file that maps keys to translated strings
- Files are saved to `lang/{code}.json`
- Delete any language file except the default one
- Language files are automatically picked up by the translation system
- Local change tracking is stored in `data/lang-meta.json` (per-language `sha` + `updated` timestamp)
- The manager reads the list of available languages from a static mirror (`{update_mirror}/langs.json`, default `https://extend.bulletinbored.net/langs.json`) and can pull updated language files when their checksum changes. Override the mirror with the `update_mirror` setting in `config.json`.

## Update Manager (`admin_updates`)

The UpdateManager tracks installed versions of the core, plugins, and themes, and can apply updates. Before any update it runs **preflight checks** (PHP version, disk space, writability).

### Preflight Checks

```php
$errors = $updateManager->preflight('core', '1.0.0');
// Returns array of error messages (empty = all clear)
// Checks: PHP >= 8.1, disk space >= 50MB, root writable, config writable
```

### Backup & Recovery

- `backupCore()` — creates a timestamped backup in `data/backups/core_*`
- `restoreCoreBackup($path)` — restores from a backup
- `listBackups()` — lists available backups (keeps last 3)
- Failed core updates automatically restore the backup

### Version tracking

- Version tracking is stored in `data/updates.json`
- Core version is loaded dynamically from the `VERSION` file via `config.json`
- Remote update checks require setting `"update_server"` in `config.json`

### Core updates

If `update_server` points to a GitHub repository, the Update Manager uses the GitHub Releases API to discover the latest version automatically. No `versions.json` is required.

### Plugin and theme updates

Plugins and themes are checked against the repositories listed in `data/catalog.json`. If a catalog entry includes a `repo` URL pointing to GitHub, the Update Manager queries the GitHub Releases API for the latest tag.

Each catalog entry can carry two flags:

- `official` (`true`/`false`) — whether the component is curated in the official catalog. In **catalog-only mode** (`$config['allow_catalog_only'] = true`) only `official: true` entries may be installed. 
- `author_type` (`"first_party"` / `"third_party"`) — distinguishes plugins/themes developed by the bulletinbored team from community-developed ones that are still curated into the official catalog. It is purely descriptive: the catalog UI shows **"Developed by bulletinbored team"** / **"Developed by third party"** instead of a generic "official" label, and it does not affect the `official` install gate.

### GitHub token

GitHub API has a rate limit of 60 requests/hour for unauthenticated requests. You can provide a `github_token` in `config.json` to raise the limit to 5000 requests/hour. See [Configuration](configuration.md#github-token) for details.

### Legacy update server

If `update_server` is not a GitHub URL, the Update Manager falls back to fetching `versions.json` from that server:

```json
{
    "core": {"version": "1.1.0"},
    "plugins": {
        "hellobored": {"version": "1.0.0", "url": "https://example.com/plugins/hellobored.zip"}
    },
    "themes": {
        "default": {"version": "1.1.0", "url": "https://example.com/themes/default.zip"}
    }
}
```

### Applying updates

- Core updates are downloaded automatically from GitHub releases and extracted into the forum root.
- Plugin and theme updates can be downloaded automatically from GitHub if a `repo` URL is defined in `catalog.json`.
- ZIP upload via the admin panel is still supported as a fallback for plugin/theme updates.
- After extraction, version metadata is updated automatically.
