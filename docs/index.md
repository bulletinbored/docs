---
title: Welcome
description: bulletinbored — minimal, extensible forum software with zero dependencies.
---
# Welcome to bulletinbored

**bulletinbored** is minimal, extensible forum software with zero dependencies. Upload files and run — no Composer, no Docker, no deployment needed.

## Why bulletinbored?

- ⚡ **Zero Dependencies** — No Composer, no Docker, no Node.js. Just PHP 8.x with PDO. Upload the files and you're live.
- 🗄️ **SQLite & MySQL** — Choose your database. SQLite works out of the box; MySQL is supported via `config.json`.
- 🔌 **Plugin System** — Extend functionality with plugins. Hooks, custom routes, middleware, dependencies, and settings API.
- 🎨 **Theme System** — Themes work like plugins: create a folder with a `style.css` and change the forum's look.
- 🔗 **SEO-Friendly URLs** — Clean URLs like `/thread/1-slug` and `/category/2-name` via rewrite rules.
- 🛡️ **User Management** — Registration, profiles with avatars, roles, moderation, private messages, and notifications built in.
- 🔐 **Centralized Authorization** — Role-based permissions with `AuthZ`, ownership-aware checks, and `can:*` middleware. No `is_admin()` bypasses.
- 🌐 **Localization** — Built-in multilingual support with JSON translation files (EN, IT, DE, ES, FR included).
- 🔄 **Auto Updates** — Update Manager with preflight checks, backup/restore, and GitHub Releases integration.
- 🖥️ **Admin Panel** — Full dashboard: categories, users, moderation, settings, plugins, themes, catalog, updates.
- 🧪 **Zero-dependency Testing** — 422 tests covering auth, content, migrations, plugins, renderer, and security.

## Repository

- Core: https://github.com/bulletinbored/bulletinbored-core
- Plugins/Themes catalog: https://github.com/bulletinbored/bulletinbored-core/blob/master/data/catalog.json

## Quick Start

1. Upload all files to a PHP-enabled web server (PHP 8.x, PDO/SQLite or PDO/MySQL extension)
2. Ensure Apache `mod_rewrite` is enabled (for SEO-friendly URLs)
3. Ensure the `data/`, `uploads/`, and `uploads/avatars/` directories are writable by the web server
4. Visit the site in your browser — the 3-step installer starts automatically

See [Installation](installation) for the full guide.

## Documentation

- [Architecture](architecture) — Understand the MVC structure, manager system, and directory layout.
- [Configuration](configuration) — Database, email, themes, localization, and update server settings.
- [Rendering](rendering) — Micro template engine: escaping, components, slots, view composers.
- [CLI & Migrations](cli-migrations) — Zero-dependency CLI (`bb.php`), migration system, `doctor` diagnostics.
- [Plugin Development](plugins) — Create plugins with hooks, custom routes, CLI commands.
- [Theme Development](themes) — Build custom themes with a single `style.css` file.
- [Managers](managers) — PluginManager, ThemeManager, and UpdateManager in detail.
- [Localization](localization) — Add new languages and manage translation files.
- [Testing](testing) — Zero-dependency test suite, E2E flow tests.
- [Versioning](versioning) — Semantic versioning and release management.
- [Database](database) — Lightweight query builder (DbQuery), immutability, pagination.
- [Security Model](security) — Trust model, known risks, hardening options, trusted proxies.

## License

BSD Zero Clause — see [License](license).