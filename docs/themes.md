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
│       └── en.php              # Optional: translations
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
│       └── en.php
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
        └── en.php
```

## File Integrity Verification (New)

When installing a theme from a ZIP (via admin panel or catalog), the installer can verify that the extracted files match the `files` list declared in the theme's `manifest.json`. This prevents installation of tampered packages.

- **Enabled by default** (`"theme_verify_files": true` in `config.json`)
- **Disabled** by setting `"theme_verify_files": false`
- Themes without a `files` key in `manifest.json` are skipped by the check
- To disable: set `"theme_verify_files": false` and restart the forum

## Third-party themes

Themes distributed through the catalog may be developed by community contributors, not by the bulletinbored team. The bulletinbored team does **not** assume any responsibility for the code, security, or behavior of third-party themes. Install and use them at your own risk.

If you encounter a malicious or problematic theme, please report it on the official forum: **www.bulletinbored.net/forum**.

## Hook System