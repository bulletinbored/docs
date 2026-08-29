---
title: Plugin Development
description: bulletinbored documentation
---
# Plugins

Create plugins as single PHP files in `plugins/` or as subdirectories with a `manifest.json` and a bootstrap file. Contributions and distributed plugins are accepted under the terms of the [CLA.md](https://github.com/bulletinbored/bulletinbored-core/blob/master/CLA.md).

## Plugin Conventions

 - **File-based plugin**: a single PHP file in `plugins/`
- **Folder-based plugin**: a subdirectory in `plugins/` with a `manifest.json` and a bootstrap PHP file (e.g., `plugins/editbored/`)
- Folder-based plugins are required when the plugin needs extra assets (CSS, JS, images, lang files)

## Plugin Metadata

File-based plugins expose metadata via PHPDoc comments in the bootstrap file:

```php
/**
 * Plugin Name: MyPlugin
 * Version: 1.0.0
 * Author: Developer
 * Description: Example plugin
 */
```

Folder-based plugins use `manifest.json`:

```json
{
    "name": "editbored",
    "version": "1.0.0",
    "author": "mlzog",
    "description": "WYSIWYG Markdown editor",
    "bootstrap": "editbored.php",
    "files": [
        "editbored.php",
        "manifest.json",
        "assets/css/editbored.css",
        "assets/js/editbored.js",
        "lang/en.json"
    ]
}
```

## Hook System

Plugins register callbacks via `$pluginManager->addHook('event', $callback, $priority)`.

### Hook Types

| Method | Purpose | Returns |
|---|---|---|
| `addHook($event, $callback, $priority = 10)` | Register a callback (lower priority = earlier execution) | void |
| `runHook($event, ...$args)` | Fire an action hook (all callbacks execute) | void |
| `applyHook($event, ...$args)` | Return first non-null value from callbacks | mixed |
| `filter($event, $value, ...$args)` | Chain value through all callbacks (output → input) | mixed |
| `checkHook($event, ...$args)` | True if ANY callback returns true (veto pattern) | bool |
| `checkHookAll($event, ...$args)` | True only if ALL callbacks return true | bool |
| `removeHook($event, $callback)` | Unregister a callback | void |

### Actions vs Filters vs Checks

- **Actions** (`runHook`): Side effects only. All callbacks fire in priority order.
- **Filters** (`filter`): Transform a value. Each callback receives the accumulated value and returns a modified version.
- **Checks** (`checkHook`/`checkHookAll`): Permission/veto gates. Return true to allow/block.

## Core Events

### CRUD Hooks — Threads

| Event | Type | Arguments | When |
|---|---|---|---|
| `thread_before_create` | filter | `$data` (array) | Before thread INSERT. Modify data before save. |
| `thread_after_create` | action | `$threadId`, `$data` | After thread INSERT |
| `thread_create_block` | check | `$data` | Return true to veto thread creation |
| `thread_before_update` | filter | `$data`, `$thread` | Before thread UPDATE |
| `thread_after_update` | action | `$threadId`, `$data`, `$thread` | After thread UPDATE |
| `thread_before_delete` | action | `$threadId`, `$thread` | Before thread DELETE |
| `thread_after_delete` | action | `$threadId`, `$thread` | After thread DELETE |
| `thread_delete_block` | check | `$thread` | Return true to veto deletion |

### CRUD Hooks — Posts

| Event | Type | Arguments | When |
|---|---|---|---|
| `post_before_create` | filter | `$data`, `$thread` | Before post INSERT |
| `post_after_create` | action | `$postId`, `$data`, `$thread` | After post INSERT |
| `post_create_block` | check | `$data`, `$thread` | Return true to veto post creation |
| `post_before_update` | filter | `$data`, `$post` | Before post UPDATE |
| `post_after_update` | action | `$postId`, `$data`, `$post` | After post UPDATE |
| `post_before_delete` | action | `$postId`, `$post` | Before post DELETE |
| `post_after_delete` | action | `$postId`, `$threadId` | After post DELETE |
| `post_delete_block` | check | `$post` | Return true to veto deletion |

### Rendering Hooks

| Event | Type | Arguments | When |
|---|---|---|---|
| `thread_before_view` | filter | `$thread` | Before thread data is rendered |
| `thread_posts_before_view` | filter | `$posts`, `$thread` | Before posts array is rendered |
| `thread_before_render` | action | `$thread`, `$posts` | Before template include |
| `thread_after_render` | action | `$thread`, `$posts` | After template include |
| `thread_not_found` | apply | `$threadId` | Custom 404 fallback. Return HTML to override. |
| `before_render` | action | — | Before any page render (head injection) |
| `frontend_before_render` | action | — | Before frontend page render |
| `admin_before_render` | action | — | Before admin page render |
| `footer_before_render` | action | — | Before footer render |
| `render_content` | filter | `$text` | Post content rendering. Return HTML to override Markdown. |

### Auth & Permission Hooks

| Event | Type | Arguments | When |
|---|---|---|---|
| `auth_before_verify` | filter | `$user`, `$username`, `$password` | Before password verification |
| `auth_login_block` | check | `$user` | Return true to block login |
| `auth_after_login` | action | `$userId`, `$user` | After successful login |
| `auth_login_failed` | action | `$username` | After failed login attempt |
| `permission_{name}` | check | `$roleName` | Custom permission check (e.g. `permission_can_ban_users`) |

### User Hooks

| Event | Type | Arguments | When |
|---|---|---|---|
| `user_registered` | action | `$userId`, `$username` | After user registration |

### Example: Block Thread Creation

```php
function myplugin_init() {
    global $pluginManager;
    $pluginManager->addHook('thread_create_block', function(array $data): bool {
        return strpos($data['title'] ?? '', 'spam') !== false;
    });
}
```

### Example: Filter Post Content Before Save

```php
function myplugin_init() {
    global $pluginManager;
    $pluginManager->addHook('post_before_create', function(array $data, array $thread): array {
        $data['content'] = str_replace('badword', '****', $data['content']);
        return $data;
    });
}
```

### Example: Custom Permission

```php
function myplugin_init() {
    global $pluginManager;
    // Grant 'can_ban_users' permission to a custom role
    $pluginManager->addHook('permission_can_ban_users', function(string $roleName): bool {
        return $roleName === 'super_mod';
    });
}
```

## Directory Structure

```
plugins/
├── hellobored/                 # Example folder-based plugin
│   ├── manifest.json           # Required: metadata
│   ├── hellobored.php          # Required: bootstrap with hellobored_init()
│   ├── assets/
│   │   ├── css/
│   │   │   └── hellobored.css  # Example styles
│   │   └── js/
│   │       └── hellobored.js   # Example logic
│   ├── upload.php              # Optional: custom endpoint
│   ├── lang/
│   │   └── en.php              # Optional: translations
│   └── vendor/                 # Optional: third-party assets
└── someplugin.php              # Example file-based plugin
```

## Shipping as ZIP

To distribute a plugin as a ZIP package:

1. Package your plugin so that the plugin folder is at the root of the ZIP
2. For file-based plugins, the PHP file should be at the root of the ZIP
3. For folder-based plugins, the folder should be at the root of the ZIP
4. Upload via **Admin Panel → Plugins → Install Plugin**

Recommended ZIP layout:
```
myplugin-1.0.0.zip
├── myplugin/
│   ├── manifest.json
│   ├── myplugin.php
│   └── assets/...
```

The installer automatically detects a single top-level folder and flattens it.

## Managing Plugins

- **Enable / Disable**: toggle plugin state without deleting files
- **Delete**: removes the plugin files and clears state from `data/plugins.json`
- **Install**: upload a ZIP to add the plugin
- **Update**: the Update Manager can apply new versions as ZIP packages

### Directory Structure

```
plugins/
└── myplugin/
    ├── manifest.json
    ├── myplugin.php
    ├── api.php
    ├── assets/
    │   ├── css/
    │   │   └── myplugin.css
    │   └── js/
    │       └── myplugin.js
└── lang/
    └── en.json
```


## Localization

Plugins can be localized independently from the core. Each plugin gets its own translation **scope**, so plugin strings never collide with the core or with other plugins (e.g. two plugins may both use a `title` key without conflict).

Folder-based plugins only (file-based plugins cannot carry lang files): place translation files under `lang/` using the language code as filename:

```
plugins/myplugin/
└── lang/
    ├── en.json
    └── it.json
```

Each file is a JSON object of string keys to string values:

```json
{
    "bold": "Bold",
    "italic": "Italic"
}
```

The strings are loaded automatically into the `plugin:<name>` scope (e.g. `plugin:myplugin`) based on the active language, and are available before the plugin's `init` hook runs.

### Usage

Use the `pt()` helper, which is equivalent to `t($key, $params, 'plugin:<name>')`:

```php
echo pt('myplugin', 'bold');                 // -> 'Bold'
echo pt('myplugin', 'hello', ['name' => 'Joe']); // with {name} placeholder
```

You may also call the core translation function directly with an explicit scope:

```php
echo t('bold', [], 'plugin:myplugin');
```

If a key is missing in the plugin's language file, the key itself is returned (untranslated) — so a plugin that ships no `lang/` directory still works unchanged. The core translation function `t($key, $params)` continues to resolve only from the `core` scope and is unaffected by plugin translations.

## Content Security Policy (CSP)

The core sends a strict CSP header with a per-request nonce. Any inline `<script>` tag emitted by a plugin (in hook output, templates, or API responses) **must** carry this nonce or the browser will block it:

```html
<script nonce="<?= htmlspecialchars(csp_nonce(), ENT_QUOTES, 'UTF-8') ?>">
    // your inline code
</script>
```

The nonce is available on every request via `csp_nonce()`. External script files loaded from `'self'` or the allowed CDN (`cdn.jsdelivr.net`) do not need the nonce. Embeds (YouTube, Twitter/X, Instagram, Facebook) are loaded in iframes and are
restricted by the CSP `frame-src` allow-list, not by `script-src`.

Avoid inline event handlers (`onclick`, `onload`, ...); they are blocked by the CSP. Attach listeners from an external script or a nonce'd inline script instead.

## Plugin Manager API

```php
// Discovery
$pluginManager->discover();
$pluginManager->getAll();
$pluginManager->getEnabled();
$pluginManager->getByName('myplugin');

// State
$pluginManager->isEnabled('myplugin');
$pluginManager->enable('myplugin');
$pluginManager->disable('myplugin');

// Localization
$pluginManager->loadTranslations($lang);   // loads plugin/lang/{$lang}.json into the plugin:<name> scope

// Lifecycle
$pluginManager->loadEnabled();
$pluginManager->installFromZip('/path/to/plugin.zip');
$pluginManager->delete('myplugin');

// Versioning
$pluginManager->getVersion('myplugin');

// Hooks
$pluginManager->addHook('event', $callback);           // priority 10 (default)
$pluginManager->addHook('event', $callback, 5);        // higher priority = earlier
$pluginManager->removeHook('event', $callback);
$pluginManager->runHook('event', ...$args);            // action: fire all callbacks
$pluginManager->applyHook('event', ...$args);          // return first non-null
$pluginManager->filter('event', $value, ...$args);     // chain value through callbacks
$pluginManager->checkHook('event', ...$args);          // true if any callback returns true
$pluginManager->checkHookAll('event', ...$args);       // true if all callbacks return true

// Router (new in 0.6.0)
$pluginManager->setRouter($router);                     // bind the router (called by core, optional)
$pluginManager->getRouter();                           // get the router instance
$pluginManager->registerRoute('GET', '/my-plugin/endpoint', $handler);  // register a custom route
$pluginManager->registerMiddleware('my_mw', $fn);      // register named middleware
$pluginManager->applyRoutes();                         // apply registrations (called by core)
```

## Custom Routes and Middleware

Plugins can register custom routes and middleware during their `init()` hook. These are applied before dispatch:

```php
function myplugin_init() {
    global $pluginManager;
    
    $router = $pluginManager->getRouter();
    if (!$router) return;
    
    // Register a custom route
    $pluginManager->registerRoute('GET', '/my-plugin/api', function() {
        header('Content-Type: application/json');
        echo json_encode(['status' => 'ok']);
        return ['status' => 200, 'body' => ''];
    });
    
    // Register a custom middleware
    $pluginManager->registerMiddleware('my_plugin_auth', function($params) {
        if (!some_check()) {
            return ['status' => 403, 'body' => 'Forbidden'];
        }
        return null;
    });
}
```

Route handlers receive `$params` (array of matched route parameters) and should return `null` to continue, or `['status' => int, 'body' => string]` to short-circuit the response. Optional `headers` array can be added for redirects: `['status' => 302, 'body' => '', 'headers' => ['Location: /target']]`.

## Third-party plugins

The catalog mixes plugins developed by the bulletinbored team (**first-party**) and plugins developed by community contributors (**third-party**). The catalog UI labels each one so you can tell them apart. Every catalog entry is **reviewed by the bulletinbored team before being added to the catalog**.

Even so, the bulletinbored team does **not** assume any responsibility for the code, security, or behavior of third-party plugins. Installing one remains an act of trust in its author. If a plugin is later found to be malicious, bulletinbored will remove it from the catalog as soon as it is reported by a user. Install and use them at your own risk.

If you encounter a malicious or problematic plugin, please report it on the official forum: **www.bulletinbored.net/forum**.