---
title: Theme Development
description: bulletinbored documentation
---
# Themes

Create themes as subdirectories in `themes/` with a `manifest.json` and a `style.css` file. Themes are distributed via ZIP packages or through the admin catalog.

## Theme Conventions

- **Folder-based theme**: a subdirectory in `themes/` with a `manifest.json` and a `style.css` file (e.g., `themes/freshbored/`)
- The `style.css` file must contain theme metadata at the top (e.g., theme name, version, author)

## Theme Metadata

Themes use `manifest.json` for additional metadata:

```json
{
    "name": "freshbored",
    "version": "1.0.0",
    "author": "mlzog",
    "description": "Default frontend theme for bulletinbored. Bootstrap 5 based, sidebar driven discussion layout."
}
```

And `style.css` must contain:

```
/*
Theme Name: freshbored
Theme Version: 1.0.0
Theme Author: mlzog
Theme Description: Default frontend theme for bulletinbored
*/
```

## Directory Structure

```
themes/
├── freshbored/                 # Example theme
│   ├── manifest.json           # Optional: theme metadata
│   ├── style.css               # Required: theme styles (must contain metadata at top)
│   ├── layout/
│   │   └── default.php
│   ├── assets/
│   │   ├── css/
│   │   │   └── style.css
│   │   └── js/
│   │       └── main.js
│   └── lang/
│       └── en.json              # Optional: translations
└── someother/                  # Another example theme
```

## Shipping as ZIP

To distribute a theme as a ZIP package:

1. Package your theme so that the theme folder is at the root of the ZIP
2. The folder should contain `style.css` and optional `manifest.json` at the root
3. Upload via **Admin Panel → Themes → Install Theme**

Recommended ZIP layout:

```
freshbored-1.0.0.zip
├── freshbored/
│   ├── style.css
│   ├── manifest.json
│   ├── layout/
│   │   └── default.php
│   ├── assets/
│   │   ├── css/
│ │   │   └── style.css
│   │   └── js/
│   │       └── main.js
│   └── lang/
│       └── en.json
```

The installer automatically detects the theme folder and installs it.

## Managing Themes

- **Enable / Disable**: toggle theme state without deleting files
- **Delete**: removes the theme files (protected: `freshbored` cannot be deleted)
- **Activate**: set as active theme
- **Install**: upload a ZIP to add the theme
- **Update**: the Update Manager can apply new versions as ZIP packages

### Directory Structure

```
themes/
└── freshbored/
    ├── style.css
    ├── manifest.json
    ├── layout/
    │   └── default.php
    ├── assets/
    │   ├── css/
    │   │   └── style.css
    │   └── js/
    │       └── main.js
    └── lang/
        └── en.json
```

## File Integrity Verification (New)

When installing a theme from a ZIP (via admin panel or catalog), the installer can verify that the extracted files match the `files` list declared in the theme's `manifest.json`. This prevents installation of tampered packages.

- **Enabled by default** (`"theme_verify_files": true` in `config.json`)
- **Disabled** by setting `"theme_verify_files": false`
- Themes without a `files` key in `manifest.json` are skipped by the check
- To disable: set `"theme_verify_files": false` and restart the forum

## Third-party themes

The catalog mixes themes developed by the bulletinbored team (**first-party**) and themes developed by community contributors (**third-party**). The catalog UI labels each one so you can tell them apart. Every catalog entry is **reviewed by the bulletinbored team before being added to the catalog**.

Even so, the bulletinbored team does **not** assume any responsibility for the code, security, or behavior of third-party themes. Installing one remains an act of trust in its author. If a theme is later found to be malicious, bulletinbored will remove it from the catalog as soon as it is reported by a user. Install and use them at your own risk.

If you encounter a malicious or problematic theme, please report it on the official forum: **www.bulletinbored.net/forum**.

## Relationship with the Hook System

Themes are presentation only: they ship `style.css`, a `layout/` template, and optional `assets/` and `lang/`. A theme is **not** loaded as executable PHP, so it cannot register hooks or run backend logic on its own.

The hook/event system is part of the **Plugin** API, not the theme API. Plugins register callbacks via `PluginManager::addHook($event, $callback)` and react to core events such as `before_render`, `frontend_before_render`, `admin_before_render`, `footer_before_render`, and `user_registered`. If you need to trigger behavior when one of these events fires, build a plugin rather than a theme.

This means a theme can only influence what is rendered by editing its templates and styles — any dynamic reaction to forum events must be implemented in a plugin that hooks into the active theme's output.