---
title: Architecture
description: Understand the MVC structure, manager system, and directory layout.
---
# Architecture

## Manager System (backend classes in `lib/`)

- **PluginManager** — handles plugin discovery, enable/disable, hook registration/execution
- **ThemeManager** — handles theme discovery, activation, and CSS URL/path resolution
- **UpdateManager** — handles version tracking and update checks for core, plugins, and themes

All managers are instantiated in `index.php` (after the bootstrap) and are fully integrated into the routing layer and admin panel.

## Layered Structure (no framework, zero dependencies)

The application is still a single upload with **no Composer, no Docker, no build step** — but the old single `index.php` has been split into small, focused files under `src/`:

- `index.php` — the thin front controller. It only wires the bootstrap, database, managers and router, then delegates request handling to `src/actions.php`.
- `src/bootstrap.php` — session start, install check, `config.php` load, i18n setup (`t()`/`pt()`/`tt()`) and a hand-written PSR-4 autoloader for the `Bulletin\` namespace (no Composer needed).
- `src/helpers.php` — pure helper functions: `slugify()`, `url()`, `escape()`, `base_url()`, CSRF helpers, presentation helpers (`time_ago()`, `render_avatar()`, `fetch_threads()`, ...) and `send_email()`.
- `src/Router.php` — maps the incoming request path to `$_GET['action']` (pretty URLs).
- `src/setup.php` — ensures directories exist and initialises the database (SQLite/MySQL schema, defaults).
- `src/actions.php` — the request dispatch / routing table. Contains the per-action logic (home, thread, login, admin panels, ...).

Key traits that remain unchanged:

- SQLite by default, MySQL configurable via `config.php`
- Session-based authentication
- Routing via `$_GET['action']`, resolved from pretty URLs by `src/Router.php`
- SEO-friendly URLs via `.htaccess` rewrite rules

## SEO-Friendly URLs

Clean URLs are supported via `.htaccess` rewrite rules:

- `/thread/{id}-{slug}` — single thread view
- `/category/{id}-{slug}` — category view
- `/u/{username}` — user profile

Old query-string URLs (`?action=thread&id=1`) still work internally.

## Directory Structure

```
/bulletinbored/
├── config.php             # Configuration (database, email, site, theme, localization)
├── index.php              # Thin front controller (bootstrap + routing only)
├── router.php             # Router for PHP built-in server (dev)
├── .htaccess              # SEO-friendly URL rewrites
├── lib/                   # Backend managers (PluginManager, ThemeManager, UpdateManager)
│   ├── BbPdo.php          # PDO wrapper used by the data layer
│   ├── repo_install.php   # Repository-based install/upgrade helpers
├── src/                   # Application core (no framework)
│   ├── bootstrap.php      # session, config, i18n, PSR-4 autoloader
│   ├── helpers.php        # slugify, url, escape, base_url, CSRF, fetch_threads, send_email, ...
│   ├── Router.php         # Bulletin\Router — pretty-URL → $_GET['action']
│   ├── setup.php          # directory checks + database initialisation
│   └── actions.php        # request dispatch / routing table
├── views/                 # Template files
│   ├── header.php         # Shared frontend header/footer (loads theme CSS)
│   ├── home.php           # Thread listing with sidebar categories + pagination
│   ├── thread.php         # Thread view with replies, attachments, pagination
│   ├── new_thread.php     # New thread form with category + file upload
│   ├── edit_post.php      # Edit post form
│   ├── login.php          # Login form with "Forgot Password" link
│   ├── register.php       # Registration form with email field
│   ├── profile.php        # User profile page with avatar, role badge, threads
│   ├── edit_profile.php   # Edit profile form (username, email, password, avatar)
│   ├── admin.php          # Admin dashboard (Bootstrap 5)
│   ├── admin_header.php   # Admin panel header
│   ├── admin_footer.php   # Admin panel footer
│   ├── admin_moderation.php # Moderation queue
│   ├── admin_categories.php # Category management
│   ├── admin_users.php    # User management
│   ├── admin_settings.php # Site settings
│   ├── admin_plugins.php  # Plugin manager
│   ├── admin_themes.php   # Theme manager
│   ├── admin_langs.php    # Language file manager
│   ├── admin_updates.php  # Update manager
│   ├── forgot_password.php # Password reset request form
│   └── reset_password.php  # Password reset form with token
├── themes/                # Theme system (like plugins)
│   └── freshbored/
│       └── style.css      # Default theme styles
├── plugins/               # Plugin system (empty by default)
├── uploads/               # File upload storage (auto-created)
│   └── avatars/           # User avatar uploads
├── data/                  # SQLite database storage (auto-created)
├── lang/                  # Localization files
│   ├── en.php             # English translations
│   └── it.php             # Italian translations
└── README.md
```

## Theme System

Themes work like plugins — each theme is a folder in `themes/` with a `style.css` file:

- Configure active theme in `config.php`: `'theme' => 'freshbored'`
- Create custom themes by adding folders in `themes/`
- Theme CSS is automatically loaded by `views/header.php`
- All frontend pages use the active theme
- Admin panel uses Bootstrap 5 default styles

## Plugin System

Plugins are PHP files in `plugins/` that define an `{name}_init()` function:

- `$pluginManager->addHook('event', $callback)` — register a hook
- `$pluginManager->runHook('event', ...$args)` — fire a hook
- Plugins are auto-loaded on every request

Example plugin in `plugins/hellobored/hellobored.php` demonstrates the pattern.