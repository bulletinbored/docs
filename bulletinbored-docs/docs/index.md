---
title: Welcome
description: bulletinbored — minimal, extensible forum software with zero dependencies.
---
# Welcome to bulletinbored

**bulletinbored** is minimal, extensible forum software with zero dependencies. Upload files and run — no Composer, no Docker, no deployment needed.

## Why bulletinbored?

- ⚡ **Zero Dependencies** — No Composer, no Docker, no Node.js. Just PHP 8.x with PDO. Upload the files and you're live.
- 🗄️ **SQLite & MySQL** — Choose your database. SQLite works out of the box; MySQL is supported via `config.php`.
- 🔌 **Plugin System** — Extend functionality with simple PHP files. Hooks let you attach to forum events.
- 🎨 **Theme System** — Themes work like plugins: create a folder with a `style.css` and change the forum's look.
- 🔗 **SEO-Friendly URLs** — Clean URLs like `/thread/1-slug` and `/category/2-name` via rewrite rules.
- 🛡️ **User Management** — Registration, profiles with avatars, roles, moderation, private messages, and notifications built in.
- 🌐 **Localization** — Built-in multilingual support with simple translation files (EN, IT included).
- 🔄 **Auto Updates** — Update Manager checks for new versions of core, plugins, and themes via GitHub Releases.
- 🖥️ **Admin Panel** — Full dashboard: categories, users, moderation, settings, plugins, themes, and languages.

## Repository

- Core: https://github.com/bulletinbored/bulletinbored-core
- Plugins/Themes catalog: https://github.com/bulletinbored/bulletinbored-core/blob/master/data/catalog.json

## Quick Start

1. Upload all files to a PHP-enabled web server (PHP 8.x, PDO/SQLite or PDO/MySQL extension)
2. Ensure Apache `mod_rewrite` is enabled (for SEO-friendly URLs)
3. Ensure the `data/`, `uploads/`, and `uploads/avatars/` directories are writable by the web server
4. Visit the site in your browser — the 2-step installer starts automatically

See [Installation](installation) for the full guide.

## Documentation

- [Architecture](architecture) — Understand the MVC structure, manager system, and directory layout.
- [Configuration](configuration) — Database, email, themes, localization, and update server settings.
- [Plugin Development](plugins) — Create plugins with hooks and extend the forum's functionality.
- [Theme Development](themes) — Build custom themes with a single `style.css` file.
- [Managers](managers) — PluginManager, ThemeManager, and UpdateManager in detail.
- [Localization](localization) — Add new languages and manage translation files.
- [Versioning](versioning) — Semantic versioning and release management.

## License

BSD Zero Clause — see [License](license).