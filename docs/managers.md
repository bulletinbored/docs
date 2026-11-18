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
- Install plugins by uploading a single ZIP package that contains a plugin folder with `manifest.json` and its bootstrap. Admin uploads and catalog/repository installs use the same package/manifest pipeline; a ZIP is not treated as a collection of loose PHP files.
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

**Rendering:** `thread_before_view`, `thread_posts_before_view`, `thread_before_render`, `thread_after_render`, `thread_not_found`, `before_render`, `frontend_before_render`, `admin_before_render`, `admin_sidebar_items`, `footer_before_render`, `render_content`

**Auth:** `auth_before_verify`, `auth_login_block`, `auth_after_login`, `auth_login_failed`

**Permissions:** `permission_{name}` (dynamic, e.g. `permission_posts.edit`)

**Users:** `user_registered`

**Plugin lifecycle:** `plugin_installed`, `plugin_updating`, `plugin_updated`, `plugin_enabled`, `plugin_disabled`, `plugin_auto_disabled`, `plugin_uninstalling`, `plugin_uninstalled`, `plugin_load_failed`

See [Plugin Development](plugins.md#lifecycle-events) for argument signatures and ordering.

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

### Architecture

The update system is split across four classes:

| Class | File | Responsibility |
|---|---|---|
| `UpdateManager` | `lib/UpdateManager.php` | Orchestration: version tracking, checkAll, applyUpdate |
| `UpdateFetcher` | `lib/UpdateFetcher.php` | HTTP requests, caching, remote version fetching |
| `UpdateBackup` | `lib/UpdateBackup.php` | Core backup/restore, recursive copy/delete, backup manifests |
| `AtomicFile` | `lib/AtomicFile.php` | Verified atomic writes for `data/updates.json`, `VERSION` and `config.json` |

`UpdateManager` delegates HTTP/cache operations to `UpdateFetcher`, backup operations to `UpdateBackup` and metadata writes to `AtomicFile`.

### API

```php
// Version tracking
$updateManager->setVersion('plugin', 'myplugin', '1.2.0');
$updateManager->getVersion('plugin', 'myplugin');
$updateManager->recordCheck('plugin', 'myplugin', '1.2.0');

// Check for updates
$results = $updateManager->checkAll($coreVersion, $pluginManager, $themeManager, $catalog);

// Apply updates
$updateManager->applyCoreUpdate('v1.0.0');
$updateManager->applyExtensionUpdate('plugin', 'myplugin', 'v1.2.0');
$updateManager->applyUpdate('plugin', 'myplugin', '/path/to/file.zip');

// Preflight checks
$errors = $updateManager->preflight('core', '1.0.0');

// Backup & recovery
$updateManager->backupCore();
$updateManager->restoreCoreBackup($path);
$updateManager->listBackups();

// Catalog (auto-refreshing, falls back to the local cache)
$catalog = $updateManager->getCatalog($forceRefresh = false, $ttl = 3600);

// Remote version (direct)
$version = $updateManager->getRemoteVersion('plugin', 'myplugin', $repoUrl);
```

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

Backup integrity rules:

- The manifest (`data/backups/core_*.json`) is written only after every entry has been copied. A backup without a valid `complete` manifest is listed with `complete: false` and is never used to prune files during a restore.
- Hidden files are included. `listEntries()` and `deleteRecursive()` use `scandir()` rather than `glob('*')`, so `.htaccess` and other dotfiles are backed up and restored.
- Symlinks are recorded but never followed or copied.
- Restore boundaries: a restore copies the backed-up entries back, then removes top-level entries that were created by the failed update. Pruning happens only when a valid manifest exists; with an incomplete backup the restore copies files back and leaves everything else in place.

### Atomic metadata writes

`UpdateManager` writes `data/updates.json`, `VERSION` and `config.json` through `lib/AtomicFile.php`. The content goes to a temporary file in the same directory, the exact byte count and (for JSON) the encoded content are verified, and only then is the target replaced with `rename()`. A failed write leaves the previous file untouched; credential-bearing `config.json` defaults to mode `0600`. This is why a core update can report a metadata failure instead of claiming success after a short write.

### Version tracking

- Version tracking is stored in `data/updates.json`
- Core version is read from `config.json`; the installer and updater write that value from `VERSION`
- Remote update checks require setting `"update_server"` in `config.json`

### Prerelease updates

Prereleases are opt-in. Set `allow_prerelease_updates` to `true` in `config.json` to receive release candidates. `UpdateManager::isPrerelease()` treats a SemVer suffix after the patch number (`1.0.0-rc.1`, `1.0.0-beta.2`) as a prerelease; build metadata alone (`1.0.0+build`) is not one. `isUpdateAllowed()` only offers a remote version that is strictly newer, and it rejects a prerelease when the installation is stable unless the administrator opted in. An installation already running a prerelease may follow the next prerelease. Stable installations are therefore never offered RC builds.

### Core updates

If `update_server` points to a GitHub repository, the Update Manager uses the GitHub Releases API to discover the latest version automatically. No `versions.json` is required.

A core update runs the same safety pipeline for both the GitHub download and a manually uploaded core ZIP:

1. **Preflight**: checks PHP 8.1+, free disk space, root writability and `config.json` writability (`preflight()`).
2. **Verified backup**: `UpdateBackup::backupCore()` copies the installation (excluding `data`, `plugins`, `themes`, `uploads`, `vendor`, `config.json`, `config.php`) into `data/backups/core_*`. A backup is only valid when it completes: a JSON manifest next to the directory records `complete: true` and the entries it contains. A failed or short write removes the partial backup and its manifest instead of leaving a half backup behind.
3. **Copy or extract**: the package is copied over the installation. Any failure during the copy or the nested-directory flattening restores the backup before reporting failure.
4. **Metadata finalization**: the new version is written to `data/updates.json`, `VERSION` and `config.json` (or the legacy `config.php`) through atomic writes. The update is reported as successful only when every metadata write verifies; otherwise the failure is logged with the exact step.
5. **Installer cleanup**: `install.php`, `install2.php` and `install3.php` are removed after a core update. `api/install.php` is deliberately kept: it is the runtime admin endpoint used to install plugins and themes from the catalog, protected by a database-backed administrator check.

### Plugin and theme updates

Plugins and themes are checked against the repositories listed in `data/catalog.json`. If a catalog entry includes a `repo` URL pointing to GitHub, the Update Manager queries the GitHub Releases API for the latest tag.

`getCatalog($forceRefresh = false, $ttl = 3600)` refreshes the local cache from `{update_mirror}/catalog.json` when the cache is missing or older than the TTL, and falls back to the local cache when the mirror is unreachable. `applyExtensionUpdate()` uses that refreshed catalog to resolve a repository, then falls back to the `repo` recorded in `data/installed.json` at install time. This lets updates work for an extension installed from a repository that is no longer in the catalog.

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

- Core updates are downloaded automatically from GitHub releases or uploaded as a ZIP, then installed through the preflight, verified-backup, copy, rollback and metadata-finalization pipeline described above. Both routes share `completeCoreUpdate()` and `finalizeCoreUpdate()`.
- Plugin and theme updates can be downloaded automatically from GitHub if a `repo` URL is defined in `catalog.json`.
- Installing an extension from a repository (catalog or `installFromRepo()`) uses the same pipeline as a ZIP install: the package is downloaded into a staging directory and validated (manifest plus core/PHP constraints and, when enabled, the `files` integrity list) before the existing directory is moved aside and the staged package swapped in. Reinstalling over an existing plugin also runs `plugin_updated` / `on_update` and rolls back files plus the `installed.json` record on failure.
- ZIP upload via the admin panel is supported for plugin/theme updates.
- After a successful update, the version recorded in `data/updates.json` is read from the updated package's `manifest.json`; the package files themselves are not rewritten.

#### `applyUpdate()` behavior

`applyUpdate()` dispatches to different strategies based on the `$type` parameter:

- **`plugin` / `theme`** — Delegates to the manager that owns the package lifecycle:
  - `plugin` → `PluginManager::updateFromZip($name, $zipPath)`
  - `theme` → `ThemeManager::updateFromZip($name, $zipPath)`

  Both use the same rollback-safe pipeline:

  1. Runs preflight checks (disk space, writability)
  2. Moves the existing extension directory to `_old_{name}_{uniqid}` (if present)
  3. Extracts the ZIP and verifies the manifest plus, when enabled, the `files` integrity list
  4. For plugins, runs `plugin_updated` and `<key>_on_update()` **before** the backup is committed
  5. Commits by moving the staged package into place
  6. On any failure: deletes the staged package, restores the `_old_*` backup, restores the previous `installed.json` record, and returns a failure

  Because the Update Manager calls straight into `PluginManager` / `ThemeManager`, **"Update All" and the admin panel share one pipeline**: the same manifest/core/PHP constraint checks, file-integrity verification, lifecycle hooks (`on_update`) and rollback guarantees apply no matter how the update was triggered. The `verifyConfigKey` used matches the per-type admin toggle (`plugin_verify_files` / `theme_verify_files`).

  > **Rollback is filesystem-only.** If a lifecycle hook fails, the previous files and `installed.json` record are restored, but database changes the hook already performed are **not** automatically reverted. Plugin authors should keep migrations idempotent or provide their own rollback.

- **`core`** — Both the GitHub download (`applyCoreUpdate()`) and a manual core ZIP (`applyUpdate('core', ...)`, `applyCoreUpdateFromZip()`) run preflight, a verified backup, copy/extract with rollback on failure, metadata finalization and installer-script cleanup. A core ZIP is not simply extracted over the forum root.
