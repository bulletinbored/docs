---
title: API Reference
description: Public APIs available to plugins and themes — helpers, hooks, managers and core services.
---
# API Reference

**Updated:** 2026-09-25 (version 0.9.0)

This page inventories the public APIs a plugin or theme may legitimately call.
It is the basis for **Plugin API v1**. Function file paths are given without line
numbers because they drift; see the file for exact signatures.

## 1. Global helpers

Global helpers are loaded by `src/helpers.php`, which pulls the modules from
`src/Helpers/`, plus CSRF/rate-limit helpers from `src/Security.php` and CSP
helpers from `src/csp.php`.

### URL & routing — `src/Helpers/Url.php`

| Function | Signature |
|----------|-----------|
| `url()` | `url(string $action, array $params = [], bool $absolute = false): string` |
| `base_url()` | `base_url(): string` |
| `current_route_action()` | `current_route_action(): string` |
| `redirect()` | `redirect(string $url): Response` |
| `slugify()` | `slugify(string $text): string` |

### Translation & i18n — `src/bootstrap.php`

| Function | Signature |
|----------|-----------|
| `t()` | `t(string $key, array $params = [], string $scope = 'core'): string` |
| `pt()` | `pt(string $pluginName, string $key, array $params = []): string` |
| `tt()` | `tt(string $themeName, string $key, array $params = []): string` |
| `load_lang_file()` | `load_lang_file(string $path): array` |

### Output escaping & sanitization — `src/Helpers/Text.php`

| Function | Signature |
|----------|-----------|
| `escape()` | `escape($s): string` |
| `render_site_name()` | `render_site_name(string $name): string` |
| `validate_input()` | `validate_input($data): string` |
| `clean_text()` | `clean_text($data): string` |

`clean_text()` trims a raw single-line value (e.g. a thread title) and does **not**
HTML-escape it; values are stored as typed and escaped once on output with
`escape()`, like usernames. (Older versions escaped on input as well, which
double-encoded titles such as `we're`.)

### CSRF & rate limiting — `src/Security.php`

| Function | Signature |
|----------|-----------|
| `generate_csrf_token()` | `generate_csrf_token(): string` |
| `validate_csrf_token()` | `validate_csrf_token(string $token): bool` |
| `csrf_validate_request()` | `csrf_validate_request(): bool` |
| `csrf_field()` | `csrf_field(): string` |
| `rate_limit()` | `rate_limit(string $action, int $max = 10, int $window = 300, ?string $key = null): bool` |
| `rate_limit_sensitive_actions()` | `rate_limit_sensitive_actions(): array` |
| `rate_limit_client_ip()` | `rate_limit_client_ip(): string` |
| `log_security_event()` | `log_security_event(string $event, array $context = []): void` |
| `log_admin_action()` | `log_admin_action(string $action, array $context = []): void` |

### CSP — `src/csp.php`

| Function | Signature |
|----------|-----------|
| `generate_csp_nonce()` | `generate_csp_nonce(): string` |
| `csp_nonce()` | `csp_nonce(): string` |
| `send_security_headers()` | `send_security_headers(string $nonce): void` |

### Session & auth state — `src/Helpers/AuthHelpers.php`

| Function | Signature |
|----------|-----------|
| `is_logged_in()` | `is_logged_in(): bool` |
| `is_admin()` | `is_admin(): bool` |
| `is_banned()` | `is_banned(): bool` |
| `is_suspended()` | `is_suspended(): bool` |
| `can_view_thread()` | `can_view_thread(string $threadStatus): bool` |
| `validate_password_strength()` | `validate_password_strength(string $password): array` |

> **Authorization:** permission checks must go through the `AuthZ` service
> (`$authz->can()` / `$authz->canOnOwned()`). The legacy
> `user_has_permission()` helper has been **removed** in 0.9.0 — update plugins
> that still call it.

### Text & content — `src/Helpers/Text.php`

| Function | Signature |
|----------|-----------|
| `time_ago()` | `time_ago(string $datetime): string` |
| `compact_number()` | `compact_number($n): string` |
| `excerpt()` | `excerpt($text, int $length = 110): string` |
| `marked_parse()` | `marked_parse($text): string` |

### Avatar & rendering — `src/Helpers/Avatar.php`

| Function | Signature |
|----------|-----------|
| `render_avatar()` | `render_avatar($username, $avatar = '', $size = 44, $class = ''): string` |
| `avatar_initial()` | `avatar_initial($name): string` |
| `avatar_color()` | `avatar_color($name): string` |

The fallback avatar is rendered as an inline `<svg>` (CSP-safe).

### Forum data — `src/Helpers/Data.php`

| Function | Signature |
|----------|-----------|
| `sidebar_categories()` | `sidebar_categories(): array` |
| `forum_statistics()` | `forum_statistics(): array` |
| `thread_sort_options()` | `thread_sort_options(): array` |
| `fetch_threads()` | `fetch_threads(array $opts = []): array` |

### Upload & files — `src/Helpers/Upload.php`

| Function | Signature |
|----------|-----------|
| `validate_upload()` | `validate_upload(string $tmpPath, string $origName, array $allowed, int $maxSize): ?array` |
| `validate_uploaded_file()` | `validate_uploaded_file(string $tmpPath, string $origName, array $allowed, int $maxSize): ?array` |
| `get_uploaded_images()` | `get_uploaded_images(): array` |

### Email & notifications — `src/Helpers/Mail.php`, `src/Helpers/Notifications.php`

| Function | Signature |
|----------|-----------|
| `send_email()` | `send_email($to, $subject, $body): bool` |
| `notify_thread_reply()` | `notify_thread_reply($thread, int $authorId, string $content): void` |
| `notify_admin_new_user()` | `notify_admin_new_user($username, $email = ''): bool` |
| `notify_mentioned_users()` | `notify_mentioned_users($pdo, $content, $threadId, $threadTitle, $authorName, int $authorId = 0): int` |
| `create_notification()` | `create_notification(PDO $pdo, int $userId, string $type, string $title, string $message, string $link = ''): void` |
| `notification_label()` | `notification_label(array $n): string` |

`notify_thread_reply()` creates in-app notifications for the thread author and
all watchers (and emails them when `email_notifications` is enabled).
`notify_mentioned_users()` creates in-app mention notifications and emails them;
it skips the author and ignores addresses like `foo@bar`.

### Markdown — `src/markdown.php`

| Function | Signature |
|----------|-----------|
| `bb_render_content()` | `bb_render_content(string $text): string` |
| `bb_parse_markdown()` | `bb_parse_markdown(string $src): string` |
| `bb_parse_inline()` | `bb_parse_inline(string $text): string` |
| `bb_esc()` | `bb_esc(string $s): string` |

## 2. Hook system

Hooks are registered on the `PluginManager` instance.

| Method | Signature |
|--------|-----------|
| `addHook()` | `addHook(string $event, callable $callback, int $priority = 10): void` |
| `removeHook()` | `removeHook(string $event, callable $callback): void` |
| `runHook()` | `runHook(string $event, mixed ...$args): void` |
| `applyHook()` | `applyHook(string $event, mixed ...$args): mixed` |
| `filter()` | `filter(string $event, mixed $value, mixed ...$args): mixed` |
| `checkHook()` | `checkHook(string $event, mixed ...$args): bool` |
| `checkHookAll()` | `checkHookAll(string $event, mixed ...$args): bool` |
| `captureHook()` | `captureHook(string $event, mixed ...$args): void` |

### Core hooks

| Hook | Type | Description |
|------|------|-------------|
| `thread_not_found` | `applyHook` | Fallback content when a thread is not found. |
| `thread_before_view` | `filter` | Filter thread data before display. |
| `thread_posts_before_view` | `filter` | Filter the posts array before display. |
| `thread_before_render` / `thread_after_render` | `runHook` | Around thread rendering. |
| `thread_before_create` | `filter` | Filter data before thread creation. |
| `thread_create_block` | `checkHook` | Veto thread creation. |
| `thread_after_create` | `runHook` | After thread creation. |
| `post_before_create` | `filter` | Filter data before post creation. |
| `post_create_block` | `checkHook` | Veto post creation. |
| `post_after_create` | `runHook` | After post creation. |
| `post_before_update` / `post_after_update` | `filter` / `runHook` | Around post edits. |
| `thread_before_update` / `thread_after_update` | `filter` / `runHook` | Around thread edits. |
| `post_delete_block` / `post_before_delete` / `post_after_delete` | `checkHook` / `runHook` | Post deletion. |
| `thread_delete_block` / `thread_before_delete` / `thread_after_delete` | `checkHook` / `runHook` | Thread deletion. |
| `auth_before_verify` | `filter` | Filter the user before verification. |
| `auth_login_block` | `checkHook` | Veto login. |
| `auth_after_login` / `auth_login_failed` | `runHook` | Login outcomes. |
| `user_registered` | `runHook` | After registration. |
| `render_content` | `applyHook` | Override content rendering (`src/markdown.php`). |
| `permission_{name}` | `checkHook` | Dynamic permission checks. |

Render hooks emitted by `views/header.php`: `before_render`,
`frontend_before_render`, `admin_before_render`, `navbar_icons`,
`mobile_tabbar_icons`, `mobile_stack_tabs`, `mobile_stack_panes`,
`footer_before_render`.

Render hook emitted by `views/admin_header.php`: `admin_sidebar_items` (admin
sidebar entries).

## 3. PluginManager

`lib/PluginManager.php` is a thin facade composed from four traits
(`lib/PluginManager/PluginHooks.php`, `PluginManifest.php`,
`PluginDependencies.php`, `PluginPackages.php`).

| Method | Signature |
|--------|-----------|
| `setRouter()` | `setRouter(Bulletin\Router $router): void` |
| `registerRoute()` | `registerRoute(string $method, string $pattern, callable $handler, array $middleware = []): void` |
| `registerMiddleware()` | `registerMiddleware(string $name, callable $fn): void` |
| `getRouter()` | `getRouter(): ?Bulletin\Router` |
| `applyRoutes()` | `applyRoutes(): void` |
| `discover()` | `discover(): array` |
| `getAll()` | `getAll(): array` |
| `getEnabled()` | `getEnabled(): array` |
| `getByName()` | `getByName(string $name): ?array` |
| `isEnabled()` | `isEnabled(string $name): bool` |
| `enable()` / `disable()` | `enable(string $name): bool` / `disable(string $name): bool` |
| `enableWithDeps()` | `enableWithDeps(string $name): array` |
| `checkDependencies()` | `checkDependencies(string $name): array` |
| `detectCycle()` | `detectCycle(string $name, array $visited = [], array $path = []): ?array` |
| `getDependents()` | `getDependents(string $name): array` |
| `getSetting()` / `setSetting()` | `getSetting(string $pluginName, string $key, mixed $default = null): mixed` / `setSetting(string $pluginName, string $key, mixed $value): void` |
| `loadTranslations()` | `loadTranslations(string $lang): void` |
| `loadEnabled()` | `loadEnabled(): array` |
| `getVersion()` | `getVersion(string $name): string` |
| `validateManifest()` | `validateManifest(array $manifest): array` |
| `normalizeManifest()` | `normalizeManifest(array $manifest): array` |
| `getPluginState()` | `getPluginState(string $name): string` |
| `getFailedPlugins()` / `recoverPlugin()` | failure recovery |
| `installFromZip()` | `installFromZip(string $zipPath, ?string $expectedName = null, bool $replacing = false, ?callable $afterSuccess = null): array` |
| `updateFromZip()` | `updateFromZip(string $name, string $zipPath): array` |
| `installFromRepo()` | `installFromRepo(string $repoUrl, ?string $tag = null, ?string $expectedName = null): array` |
| `verifyExtractedPackage()` | `verifyExtractedPackage(string $targetDir): ?array` |
| `uninstall()` / `delete()` / `removeMissing()` | lifecycle/cleanup |

### Plugin lifecycle semantics

- A **fresh install** runs `on_install`; an **update** does not (it runs `on_update` instead). This prevents one-off setup work from repeating.
- `plugin_installed` / `plugin_updated` hooks and the lifecycle functions run **before** the previous version's backup is discarded, so a failure can still roll back.
- If a lifecycle hook throws, `installFromZip()` / `updateFromZip()` restore both the previous files **and** the previous `installed.json` record, keeping the filesystem and metadata consistent, and return a failure result.
- `installFromRepo()` stages the repository in a temporary directory and then runs the same validation and commit/rollback pipeline as `installFromZip()`. Reinstalling over an existing plugin is treated as an update, so it runs `on_update` and rolls back files plus metadata on failure.

## 4. Renderer (`Bulletin\Renderer`) — `src/Renderer.php`

`__construct(string $viewsPath)`, `addGlobal()`, `composer()`, `composeAll()`,
`render()`, `display()`, `e()`, `raw()`, `partial()`, `renderPartial()`,
`slot()` / `endSlot()` / `hasSlot()` / `slotContent()` / `renderSlot()`,
`yield()`, `layout()`, `extend()`, `when()`, `each()`, `escapeAttr()`,
`csrfField()`, `url()`, `t()`, `renderComponent()`, `displayComponent()`.

## 5. Database

### `BbPdo` — `lib/BbPdo.php`

PDO wrapper with SQLite/MySQL normalization: `__construct()`, `exec()`,
`query()`, `prepare()`.

### `DbQuery` — `lib/DbQuery.php`

Lightweight query builder: `table()`, `select()`, `where()`, `whereIn()`,
`whereRaw()`, `orderBy()`, `limit()`, `offset()`, `get()`, `first()`,
`count()`, `insert()`, `insertIgnore()`, `update()`, `delete()`, `raw()`,
`rawFirst()`, `rawExec()`, `exists()`, `pluck()`, `paginate()`.

## 6. Request (`Bulletin\Request`) — `src/Request.php`

`get()`, `post()`, `input()`, `has()`, `raw()`, `sanitize()` (static).

## 7. Router (`Bulletin\Router`) — `src/Router.php`

`middleware()`, `group()`, `api()`, `view()`, `get()`, `post()`, `put()`,
`delete()`, `patch()`, `any()`, `registerMiddleware()`, `dispatch()`,
`registerCanMiddleware()`.

## 8. ThemeManager — `lib/ThemeManager.php`

`loadTranslations()`, `discover()`, `getAll()`, `getActive()`,
`getActiveMeta()`, `activate()`, `getCssUrl()`, `getCssPath()`, `getVersion()`,
`installFromZip()`, `updateFromZip()`, `delete()`, `removeMissing()`, `installFromRepo()`.

## 9. UpdateManager — `lib/UpdateManager.php`

`setVersion()`, `getVersion()`, `recordCheck()`, `getAvailableUpdate()`,
`checkAll()`, `applyUpdate()`, `applyCoreUpdate()`, `applyExtensionUpdate()`,
`getRemoteVersion()`, `getLockedExtensions()`.

Extension updates are **delegated** to the owning manager: `applyExtensionUpdate()` and the ZIP-upload path of `applyUpdate()` call `PluginManager::updateFromZip()` for plugins and `ThemeManager::updateFromZip()` for themes, so the Update Manager does not run its own install pipeline. See [Managers → Applying updates](managers.md#applying-updates).

## 10. Migrator — `lib/Migrator.php`

`__construct(PDO $pdo, array $config)`, `addPath()`, `addPluginPaths()`,
`ensureMigrationsTable()`, `getAllMigrations()`, `getRanMigrations()`,
`getPending()`, `getNextBatch()`, `getLastBatch()`, `getMigrationsByBatch()`,
`getBatchFor()`, `runUp()`, `runDown()`, `rollbackByName()`.

## 11. Application state (`App`) — `src/App.php`

The shared application state lives in `App::getInstance()` instead of global
variables:

| Property | Description |
|----------|-------------|
| `config` | Configuration array (from `config.json`). |
| `pdo` | Database connection (`BbPdo`). |
| `authz` | `AuthZ` service. |
| `i18n` | Translation registry (core + `plugin:<name>` + `theme:<name>` scopes). |
| `pluginManager` | `PluginManager` instance (when wired by `index.php`). |
| `forwardedProto` / `forwardedSsl` | Validated proxy headers. |

> Older plugins that used `global $pdo, $config, $pluginManager` still work
> because `index.php` defines those variables, but new code should use
> `App::getInstance()`.

## 12. Plugin initialisation convention

A plugin defines an init function named after its key:

```php
function myplugin_init() {
    $app = App::getInstance();
    $pdo = $app->pdo;
    $pluginManager = $app->pluginManager;
    // Register hooks, routes, middleware, ...
}
```

`PluginManager::loadEnabled()` includes the bootstrap file and calls
`<key>_init()` automatically.

## 13. Changes in 0.9.0 relevant to plugin authors

- `user_has_permission()` removed — use `AuthZ`.
- `notify_mentioned_users()` gained an `int $authorId` parameter and now creates
  in-app notifications (not just e-mail).
- Page routes `/watch`, `/unwatch`, `/logout` are POST-only.
- Inline `style="…"` attributes are allowed (`style-src-attr 'unsafe-inline'`),
  but injected `<style>` blocks and non-allow-listed stylesheets are blocked by
  CSP.
- `PluginManager` was split into traits; all previously public methods remain
  available through the facade.
