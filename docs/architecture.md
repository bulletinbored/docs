---
title: Architecture
description: Understand the MVC structure, manager system, and directory layout.
---
# Architecture

## Manager System (backend classes in `lib/`)

- **PluginManager** — handles plugin discovery, enable/disable, hook registration/execution (actions, filters, checks)
- **ThemeManager** — handles theme discovery, activation, and CSS URL/path resolution
- **UpdateManager** — handles version tracking and update checks for core, plugins, and themes

All managers are instantiated in `index.php` (after the bootstrap) and are fully integrated into the routing layer and admin panel.

## Data Layer (`lib/DbQuery.php`)

Lightweight query builder over PDO/BbPdo. No ORM, no magic — just sugar over prepared statements:

```php
$db = new DbQuery($pdo);
$user = $db->table('users')->where('id', 42)->first();
$threads = $db->table('threads')->where('status', 'visible')->orderBy('created_at', 'DESC')->limit(10)->get();
$db->table('users')->insert(['username' => 'alice', 'email' => 'a@b.com']);
$db->table('users')->where('id', 42)->update(['email' => 'new@b.com']);
$db->table('users')->where('status', 'banned')->delete();
$page = $db->table('threads')->where('category_id', 5)->paginate(15, $page);
```

Supports SQLite and MySQL transparently via BbPdo. All core data operations use this layer.

## Rendering Layer (`src/Renderer.php`)

Micro template renderer that separates logic from presentation:

```php
$r = new Bulletin\Renderer(__DIR__ . '/views');
$r->display('thread-clean', ['thread' => $thread, 'posts' => $posts]);
```

Template helpers: `$this->e()` (escaped output), `$this->partial()`, `$this->renderComponent()`, `$this->slot()`/`$this->yield()` (layouts), `$this->csrfField()`, `$this->when()`, `$this->each()`.

## Layered Structure (no framework, zero dependencies)

The application is still a single upload with **no Composer, no Docker, no build step** — but the old single `index.php` has been split into small, focused files under `src/`:

- `index.php` — the thin front controller. It wires the bootstrap, database, managers, registers all routes and dispatches the request through `Bulletin\Router`.
- `src/bootstrap.php` — session start, install check, `config.json` load, i18n setup (`t()`/`pt()`/`tt()`) and a hand-written PSR-4 autoloader for the `Bulletin\` namespace (no Composer needed).
- `src/helpers.php` — pure helper functions: `slugify()`, `url()`, `escape()`, `base_url()`, CSRF helpers, presentation helpers (`time_ago()`, `render_avatar()`, `fetch_threads()`, ...) and `send_email()`.
- `src/Router.php` — `Bulletin\Router` — middleware-enabled request router with route groups, named parameters, and middleware pipeline.
- `src/Request.php` — `Bulletin\Request` — centralized input sanitization (get/post/input/has/raw).
- `src/Renderer.php` — `Bulletin\Renderer` — micro template engine for clean view rendering.
- `src/setup.php` — ensures directories exist and initialises the database (SQLite/MySQL schema, defaults).
- `src/actions/` — split action handlers:
  - `admin.php` — admin panel, settings, updates, catalog
  - `posts.php` — threads, replies, moderation
  - `users.php` — login, register, profile, password reset
  - `content.php` — categories, search, download
  - `misc.php` — notifications, messages

Key traits that remain unchanged:

- SQLite by default, MySQL configurable via `config.json`
- Session-based authentication
- SEO-friendly URLs via `.htaccess` rewrite rules

## SEO-Friendly URLs

Clean URLs are supported via `.htaccess` rewrite rules. All requests are routed to `index.php` where the `Bulletin\Router` matches the path against registered routes:

- `/thread/{id}-{slug}` — single thread view
- `/category/{id}-{slug}` — category view
- `/u/{username}` — user profile
- `/admin/*` — admin panel routes

## Routing with Middleware (`src/Router.php`)

The `Bulletin\Router` class handles all request dispatch through a middleware pipeline. Routes are registered in `index.php` with `get()`, `post()`, etc., and organized into groups with middleware.

### Middleware Mode Example

```php
use Bulletin\Router;

$router = new Router();

// Apply middleware to a group
$router->middleware('auth')->group(function($router) {
    $router->get('/thread/{id:\d+}', fn($p) => handle_thread($p['id']));
    $router->post('/thread/{id:\d+}/reply', fn($p) => handle_reply($p['id']));
});

// API routes
$router->api()->middleware('auth', 'csrf')->post('/api/threads', 'api_create_thread');

// Custom middleware
$router->registerMiddleware('rate_limit', function($params) {
    if (rate_limited()) return ['status' => 429, 'body' => 'Too many requests'];
    return null;
});

$router->dispatch();
```

### Built-in Middleware

| Middleware | Purpose |
|---|---|
| `guest` | Redirect logged-in users away (for login/register pages) |
| `auth` | Require authentication, redirect to login if missing |
| `admin` | Require admin role, 403 if unauthorized |
| `csrf` | Validate CSRF token on POST requests |

### Route Parameters

Named parameters with optional type constraints:

```php
$router->get('/thread/{id:\d+}', $handler);    // digits only
$router->get('/user/{name}', $handler);          // any non-slash
$router->get('/post/{slug:[a-z0-9-]+}', $handler); // custom regex
```

## Directory Structure

```
/bulletinbored/
├── config.json            # Configuration (database, email, site, theme, localization)
├── index.php              # Thin front controller (bootstrap + routing only)
├── router.php             # Router for PHP built-in server (dev)
├── .htaccess              # SEO-friendly URL rewrites
├── lib/                   # Backend managers and data layer
│   ├── BbPdo.php          # PDO wrapper with SQLite/MySQL SQL normalization
│   ├── DbQuery.php        # Lightweight query builder (table/where/first/insert/update/delete)
│   ├── PluginManager.php  # Plugin discovery, hooks, install/delete
│   ├── ThemeManager.php   # Theme discovery, activation
│   ├── UpdateManager.php  # Version tracking and updates
│   └── repo_install.php   # Repository-based install/upgrade helpers
├── src/                   # Application core (no framework)
│   ├── bootstrap.php      # session, config, i18n, PSR-4 autoloader
│   ├── helpers.php        # slugify, url, escape, base_url, CSRF, fetch_threads, send_email, ...
│   ├── Router.php         # Bulletin\Router — middleware-enabled request router
│   ├── Request.php        # Bulletin\Request — centralized input sanitization
│   ├── Renderer.php       # Bulletin\Renderer — micro template engine
│   ├── setup.php          # directory checks + database initialisation
│   ├── actions/           # split action handlers
│   │   ├── admin.php      # admin panel, settings, updates, catalog
│   │   ├── posts.php      # threads, replies, moderation
│   │   ├── users.php      # login, register, profile, password reset
│   │   ├── content.php    # categories, search, download
│   │   └── misc.php       # notifications, messages
├── views/                 # Template files
│   ├── header.php         # Shared frontend header/footer (loads theme CSS)
│   ├── thread-clean.php   # Clean thread view using components
│   ├── components/        # Reusable UI components
│   │   ├── post.php       # Single post component
│   │   └── thread_modals.php # Moderation modals
│   ├── partials/          # Legacy partials (sidebar, thread_list)
│   └── ...                # Other view templates
├── themes/                # Theme system (like plugins)
│   └── freshbored/
│       └── style.css      # Default theme styles
├── plugins/               # Plugin system
├── uploads/               # File upload storage (auto-created)
│   └── avatars/           # User avatar uploads
├── data/                  # SQLite database storage (auto-created)
│   └── .htaccess          # blocks direct access to database/config files
├── lang/                  # Localization files
│   ├── en.json            # English translations
│   └── it.json            # Italian translations
└── README.md
```

## Theme System

Themes work like plugins — each theme is a folder in `themes/` with a `style.css` file:

- Configure active theme in `config.json`: `"theme": "freshbored"`
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