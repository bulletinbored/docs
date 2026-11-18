---
title: Theme Development
description: bulletinbored documentation
---
# Themes

Create themes as subdirectories in `themes/` with a `style.css` file and an optional `manifest.json`. Themes are distributed via ZIP packages or through the admin catalog.

## Theme Conventions

- **Folder-based theme**: a subdirectory in `themes/` with a `style.css` file (e.g., `themes/freshbored/`)
- `manifest.json` is optional metadata; `style.css` is the only file the core loads
- A theme is discovered only when its folder contains `style.css`
- The core loads the active theme's stylesheet through `views/header.php`; theme templates, layouts and language files are not loaded by the core

## Theme Metadata

Themes use `manifest.json` for metadata. `ThemeManager::parseThemeManifest()` reads `manifest.json` only; metadata comments in `style.css` are not parsed.

```json
{
    "name": "freshbored",
    "version": "1.0.7",
    "author": "mlzog",
    "description": "Default frontend theme for bulletinbored. Bootstrap 5 based, sidebar driven discussion layout.",
    "files": [
        "style.css",
        "manifest.json",
        "README.md",
        "LICENSE"
    ]
}
```

Only `name`, `version`, `author` and `description` are displayed metadata. A `requires.core` field is not read by theme install or update, so it is not enforced; use the plugin manifest if you need a core-version constraint.

## Directory Structure

```
themes/
├── freshbored/                 # Default theme
│   ├── LICENSE
│   ├── README.md
│   ├── manifest.json           # Optional: theme metadata
│   └── style.css               # Required: theme styles
└── someother/                  # Another example theme
```

## Shipping as ZIP

To distribute a theme as a ZIP package:

1. Package your theme so that the theme folder is at the root of the ZIP
2. The folder must contain `style.css` at its root; `manifest.json` is optional
3. Upload via **Admin Panel → Themes → Install Theme**

Recommended ZIP layout:

```
freshbored-1.0.0.zip
├── freshbored/
│   ├── style.css
│   ├── manifest.json
│   ├── README.md
│   └── LICENSE
```

The installer automatically detects the theme folder and installs it.

## Managing Themes

- **Activate**: `activate($name)` sets the active theme; there is no separate enable/disable state
- **Delete**: `delete($name)` removes the theme files (protected: `freshbored` cannot be deleted)
- **Remove missing**: `removeMissing()` drops records for theme folders that no longer contain `style.css`
- **Install**: upload a ZIP or install from the catalog/repository. Both paths stage the package, run the same validation (including the `files` integrity list when `theme_verify_files` is enabled), and only then commit it, so the previous theme is never removed before the replacement is validated.
- **Update**: the Update Manager can apply new versions as ZIP packages. Updates go through `ThemeManager::updateFromZip()`: the current theme folder is moved to a backup, the new ZIP is extracted and verified, and the backup is removed only on success. On any failure the backup is restored and the original theme is left untouched.

### Directory Structure

```
themes/
└── freshbored/
    ├── LICENSE
    ├── README.md
    ├── manifest.json
    └── style.css
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

Themes are presentation only. The core includes the active theme's `style.css` from `views/header.php`; it does not include theme PHP, a theme layout, or theme-provided templates. A theme is therefore **not** loaded as executable PHP and cannot register hooks or run backend logic on its own.

The hook/event system is part of the **Plugin** API, not the theme API. Plugins register callbacks via `PluginManager::addHook($event, $callback)` and react to core events such as `before_render`, `frontend_before_render`, `admin_before_render`, `footer_before_render`, and `user_registered`. If you need to trigger behavior when one of these events fires, build a plugin rather than a theme.

This means a theme can only influence presentation through its stylesheet; any dynamic reaction to forum events must be implemented in a plugin.