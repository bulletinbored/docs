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
        "lang/en.php"
    ]
}
```

## Hook System

Plugins register callbacks via `$pluginManager->addHook('event', $callback)`.

## Core Events

| Event | Arguments | When |
|---|---|---|
| `after_thread` | `$threadId` | After a thread is created |
| `after_post` | `$threadId`, `$postId` | After a reply is posted |
| `user_registered` | `$userId`, `$username` | After a user registers |
| `before_render` | — | Before a page is rendered |
| `frontend_before_render` | — | Before a frontend page is rendered |
| `admin_before_render` | — | Before an admin page is rendered |
| `footer_before_render` | — | Before the footer is rendered |

### Example

```php
function myplugin_init() {
    global $pluginManager;
    $pluginManager->addHook('after_post', function($threadId, $postId) {
        // react to new posts
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
        └── en.php
```

## Localization

Plugins can be localized independently from the core. Each plugin gets its own
translation **scope**, so plugin strings never collide with the core or with
other plugins (e.g. two plugins may both use a `title` key without conflict).

Folder-based plugins only (file-based plugins cannot carry lang files): place
translation files under `lang/` using the language code as filename:

```
plugins/myplugin/
└── lang/
    ├── en.php
    └── it.php
```

Each file returns an associative array:

```php
<?php
return [
    'bold' => 'Bold',
    'italic' => 'Italic',
];
```

The strings are loaded automatically into the `plugin:<name>` scope (e.g.
`plugin:myplugin`) based on the active language, and are available before the
plugin's `init` hook runs.

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

If a key is missing in the plugin's language file, the key itself is returned
(untranslated) — so a plugin that ships no `lang/` directory still works
unchanged. The core translation function `t($key, $params)` continues to resolve
only from the `core` scope and is unaffected by plugin translations.

## Content Security Policy (CSP)

The core sends a strict CSP header with a per-request nonce. Any inline `<script>`
tag emitted by a plugin (in hook output, templates, or API responses) **must**
carry this nonce or the browser will block it:

```html
<script nonce="<?= htmlspecialchars(csp_nonce(), ENT_QUOTES, 'UTF-8') ?>">
    // your inline code
</script>
```

The nonce is available on every request via `csp_nonce()`. External script files
loaded from `'self'` or the allowed CDNs (jsdelivr, facebook.net, instagram.com,
twitter.com, youtube.com) do not need the nonce.

Avoid inline event handlers (`onclick`, `onload`, ...); they are blocked by the
CSP. Attach listeners from an external script or a nonce'd inline script instead.

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
$pluginManager->loadTranslations($lang);   // loads plugin/lang/{$lang}.php into the plugin:<name> scope

// Lifecycle
$pluginManager->loadEnabled();
$pluginManager->installFromZip('/path/to/plugin.zip');
$pluginManager->delete('myplugin');

// Versioning
$pluginManager->getVersion('myplugin');

// Hooks
$pluginManager->addHook('after_thread', $callback);
$pluginManager->removeHook('after_thread', $callback);
$pluginManager->runHook('after_thread', $threadId);
```

## Third-party plugins

Plugins distributed through the catalog may be developed by community contributors, not by the bulletinbored team. The bulletinbored team does **not** assume any responsibility for the code, security, or behavior of third-party plugins. Install and use them at your own risk.

If you encounter a malicious or problematic plugin, please report it on the official forum: **www.bulletinbored.net/forum**.
