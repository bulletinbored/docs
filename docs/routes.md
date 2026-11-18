---
title: Route Map
description: Complete inventory of HTTP routes, handlers, middleware and plugin entrypoints.
---
# Route Map

**Updated:** 2026-11-18 (version 1.0.0)

All core routes are registered in `index.php` and dispatched through
`Bulletin\Router`. Core handlers live in `src/actions/`. Plugins may register
additional routes through `PluginManager::registerRoute()`; the plugin routes
run before the core routes are registered.

## Middleware Reference

| Middleware | Behavior |
|------------|----------|
| `guest` | Redirects an already-authenticated user away (login/register/…). |
| `auth` | Redirects anonymous users to `/login`. |
| `admin` | `403` if authenticated but not an admin; redirects anonymous users to `/login`. |
| `can:<permission>` | Requires the given permission via `AuthZ` (`can:` middleware, e.g. `can:moderation.manage`). |
| `csrf` | Validates the CSRF token on POST. Available but not used by route groups — CSRF is validated inline in handlers with `csrf_validate_request()`. |

## 1. Frontend (public)

| # | Method | Path | Handler | File |
|---|--------|------|---------|------|
| 1 | GET | `/` | closure (`fetch_threads` + `views/home.php`) | `index.php:111` |
| 2 | GET | `/thread/{id:\d+}` | `handle_thread_view()` | `index.php:125` |
| 3 | GET | `/thread/{id:\d+}-{slug}` | `handle_thread_view()` | `index.php:126` |
| 4 | GET | `/category/{id:\d+}` | `handle_category()` | `index.php:127` |
| 5 | GET | `/category/{id:\d+}-{slug}` | `handle_category()` | `index.php:128` |
| 6 | GET | `/u/{user}` | `handle_profile()` | `index.php:129` |
| 7 | GET | `/search` | `handle_search()` | `index.php:130` |
| 8 | GET | `/download/{id:\d+}` | `handle_download()` | `index.php:131` |

## 2. Auth (middleware: `guest`)

| # | Method | Path | Handler | File |
|---|--------|------|---------|------|
| 9 | GET | `/login` | `handle_login('GET')` | `index.php:135` |
| 10 | POST | `/login` | `handle_login('POST')` | `index.php:136` |
| 11 | GET | `/register` | `handle_register('GET')` | `index.php:137` |
| 12 | POST | `/register` | `handle_register('POST')` | `index.php:138` |
| 13 | GET | `/forgot-password` | `handle_forgot_password('GET')` | `index.php:139` |
| 14 | POST | `/forgot-password` | `handle_forgot_password('POST')` | `index.php:140` |
| 15 | GET | `/reset-password` | `handle_reset_password('GET')` | `index.php:141` |
| 16 | POST | `/reset-password` | `handle_reset_password('POST')` | `index.php:142` |

## 3. Email verification (no middleware)

| # | Method | Path | Handler | File |
|---|--------|------|---------|------|
| 17 | GET | `/verify-email` | `handle_verify_email()` | `index.php:146` |

## 4. Authenticated user (middleware: `auth`)

| # | Method | Path | Handler | File |
|---|--------|------|---------|------|
| 18 | GET | `/new-thread` | `handle_new_thread('GET')` | `index.php:150` |
| 19 | POST | `/new-thread` | `handle_new_thread('POST')` | `index.php:151` |
| 20 | POST | `/reply` | `handle_reply_post()` | `index.php:152` |
| 21 | GET | `/edit-post/{id:\d+}` | `handle_edit_post('GET')` | `index.php:153` |
| 22 | POST | `/edit-post/{id:\d+}` | `handle_edit_post('POST')` | `index.php:154` |
| 23 | POST | `/delete-post/{id:\d+}` | `handle_delete_post()` | `index.php:155` |
| 24 | GET | `/edit-thread/{id:\d+}` | `handle_edit_thread('GET')` | `index.php:156` |
| 25 | POST | `/edit-thread/{id:\d+}` | `handle_edit_thread('POST')` | `index.php:157` |
| 26 | POST | `/delete-thread/{id:\d+}` | `handle_delete_thread()` | `index.php:158` |
| 27 | POST | `/watch` | `handle_watch()` | `index.php:159` |
| 28 | POST | `/unwatch` | `handle_unwatch()` | `index.php:160` |
| 29 | POST | `/upload-image` | `handle_upload_image()` | `index.php:161` |
| 30 | POST | `/logout` | `handle_logout()` | `index.php:162` |
| 31 | POST | `/logout-others` | `handle_logout_others_post()` | `index.php:163` |
| 32 | GET | `/edit-profile` | `handle_edit_profile('GET')` | `index.php:164` |
| 33 | POST | `/edit-profile` | `handle_edit_profile('POST')` | `index.php:165` |
| 34 | POST | `/remove-avatar` | `handle_remove_avatar('POST')` | `index.php:166` |
| 35 | POST | `/preview` | `handle_markdown_preview()` | `index.php:167` |
| 36 | GET | `/mention-users` | `handle_mention_users()` | `index.php:168` |

## 5. Admin (middleware: `admin`)

| # | Method | Path | Handler | File |
|---|--------|------|---------|------|
| 37 | GET | `/admin` | `handle_admin_dashboard()` | `index.php:173` |
| 38 | GET | `/admin/settings` | `handle_admin_settings_get()` | `index.php:174` |
| 39 | POST | `/admin/settings` | `handle_admin_settings_post()` | `index.php:175` |
| 40 | GET | `/admin/smtp` | `handle_admin_smtp_get()` | `index.php:176` |
| 41 | POST | `/admin/smtp` | `handle_admin_smtp_post()` | `index.php:177` |
| 42 | POST | `/admin/upload-site-image` | `handle_admin_upload_site_image()` | `index.php:178` |
| 43 | GET | `/admin/get-images` | `handle_admin_get_images()` | `index.php:179` |
| 44 | GET | `/admin/moderation` | `handle_admin_moderation_get()` | `index.php:180` |
| 45 | POST | `/admin/moderate` | `handle_moderate_post()` | `index.php:181` |
| 46 | POST | `/admin/front-moderate` | `handle_frontend_moderate_post()` | `index.php:182` |
| 47 | POST | `/admin/split-thread` | `handle_split_thread_post()` | `index.php:183` |
| 48 | POST | `/admin/merge-thread` | `handle_merge_thread_post()` | `index.php:184` |
| 49 | GET | `/admin/roles` | `handle_admin_roles_get()` | `index.php:185` |
| 50 | POST | `/admin/roles-action` | `handle_admin_roles_action_post()` | `index.php:186` |
| 51 | GET | `/admin/users` | `handle_admin_users_get()` | `index.php:187` |
| 52 | GET | `/admin/users/{id:\d+}/edit` | `handle_admin_user_edit('GET')` | `index.php:188` |
| 53 | POST | `/admin/users/{id:\d+}/edit` | `handle_admin_user_edit('POST')` | `index.php:189` |
| 54 | POST | `/admin/create-user` | `handle_admin_create_user_post()` | `index.php:190` |
| 55 | GET | `/admin/categories` | `handle_admin_categories('GET')` | `index.php:191` |
| 56 | POST | `/admin/categories` | `handle_admin_categories('POST')` | `index.php:192` |
| 57 | POST | `/admin/delete-category` | `handle_delete_category_post()` | `index.php:193` |
| 58 | POST | `/admin/update-category-order` | `handle_update_category_order_post()` | `index.php:194` |
| 59 | GET | `/admin/langs` | `handle_admin_langs('GET')` | `index.php:195` |
| 60 | POST | `/admin/langs` | `handle_admin_langs('POST')` | `index.php:196` |
| 61 | GET | `/admin/diagnostics` | `handle_admin_diagnostics_get()` | `index.php:197` |
| 62 | GET | `/admin/plugins` | `handle_admin_plugins('GET')` | `index.php:198` |
| 63 | POST | `/admin/plugins` | `handle_admin_plugins('POST')` | `index.php:199` |
| 64 | GET | `/admin/themes` | `handle_admin_themes('GET')` | `index.php:200` |
| 65 | POST | `/admin/themes` | `handle_admin_themes('POST')` | `index.php:201` |
| 66 | GET | `/admin/catalog` | `handle_admin_catalog('GET')` | `index.php:202` |
| 67 | POST | `/admin/catalog` | `handle_admin_catalog('POST')` | `index.php:203` |
| 68 | GET | `/admin/updates` | `handle_admin_updates('GET')` | `index.php:204` |
| 69 | POST | `/admin/updates` | `handle_admin_updates('POST')` | `index.php:205` |
| 70 | POST | `/admin/delete-user` | `handle_delete_user_post()` | `index.php:206` |
| 71 | POST | `/admin/ban-user` | `handle_ban_user_post()` | `index.php:207` |
| 72 | POST | `/admin/unban-user` | `handle_unban_user_post()` | `index.php:208` |
| 73 | POST | `/admin/suspend-user` | `handle_suspend_user_post()` | `index.php:209` |
| 74 | POST | `/admin/disconnect-user` | `handle_admin_disconnect_user_post()` | `index.php:210` |

## 6. Permission-based route (moderators + admins)

| # | Method | Path | Handler | File |
|---|--------|------|---------|------|
| 75 | POST | `/moderate/{id:\d+}` | `handle_moderate_post()` | `index.php:216` |

Registered with `middleware('auth')` → `middleware('can:moderation.manage')`.

## 7. Plugin routes (via Router)

Plugins register routes through `PluginManager::registerRoute()` and they are
applied before the core routes. Bundled examples:

| # | Method | Path | Handler | File |
|---|--------|------|---------|------|
| 76 | GET | `/notifications` | `bellbored_handle_page('GET')` | `plugins/bellbored/bellbored.php` |
| 77 | POST | `/notifications` | `bellbored_handle_page('POST')` | `plugins/bellbored/bellbored.php` |
| 78 | GET | `/messages` | `textmebored_handle_page('GET')` | `plugins/textmebored/textmebored.php` |
| 79 | POST | `/messages` | `textmebored_handle_page('POST')` | `plugins/textmebored/textmebored.php` |
| 80 | GET | `/admin/backups` | backbored admin page | `plugins/backbored/backbored.php:24` |
| 81 | POST | `/admin/backups` | backbored admin action | `plugins/backbored/backbored.php:28` |
| 82 | GET | `/admin/backups/download` | backbored archive download | `plugins/backbored/backbored.php:32` |

## 8. Plugin standalone endpoints (direct access, bypass the router)

These files are hit directly (e.g. by plugin JavaScript) and bootstrap the
application themselves. They perform their own session, CSRF and rate-limit
checks.

| # | Method | Path | Notes |
|---|--------|------|-------|
| 83 | GET/POST | `/plugins/bellbored/api.php` | Notification count/list/mark-read |
| 84 | GET/POST | `/plugins/textmebored/api.php` | Conversations, messages, search |
| 85 | GET/POST | `/plugins/updownbored/api.php` | Post scores and votes |
| 86 | POST | `/plugins/editbored/upload.php` | Editor image upload |
| 87 | GET | `/plugins/sitemapbored/sitemap.php` | Public XML sitemap (throttled) |
| 88 | GET | `/plugins/backbored/admin.php` | Standalone alias; redirects to `/admin/backups` |
| 89 | GET/POST | `/plugins/sitemapbored/admin.php` | Standalone sitemap settings page (admin only) |

## 9. Installer (direct access)

The installer is reachable on a fresh deployment and refuses to run once
`config.json` exists.

| # | Method | Path | File |
|---|--------|------|------|
| 90 | GET/POST | `/install.php` | `install.php` |
| 91 | GET/POST | `/install2.php` | `install2.php` |
| 92 | GET/POST | `/install3.php` | `install3.php` |

## 10. API endpoints (direct access)

| # | Method | Path | Notes |
|---|--------|------|-------|
| 93 | POST | `/api/install.php` | Install a plugin/theme from the catalog (admin only). Verifies the admin against the database with `AdminAuth::verifySession()`, requires a CSRF token, and is rate-limited to 20 requests per hour (`api/install.php:44-67`). |

## Summary by area

| Area | Count |
|------|-------|
| Public frontend | 8 |
| Auth | 8 |
| Email verification | 1 |
| Authenticated user | 19 |
| Admin | 38 |
| Permission-based | 1 |
| Plugin via router | 7 |
| Plugin standalone | 7 |
| Installer | 3 |
| API | 1 |
| **TOTAL** | **93 core + plugin entrypoints** |

## Observations

1. **Handlers return `Bulletin\Response`.** Every core handler returns
   `\Bulletin\Response` (or `bool` for legacy dispatching) instead of echoing and
   exiting; the router sends the response. See [Action Handlers](action-handlers).
2. **All mutations use POST.** PUT/PATCH/DELETE are supported by the router but
   unused; `/watch`, `/unwatch` and `/logout` moved from GET to POST.
3. **CSRF is inline.** The `csrf` middleware exists but no route group uses it;
   validation happens in handlers via `csrf_validate_request()`.
4. **Plugins before core.** `$pluginManager->applyRoutes()` runs before core
   route registration, so plugin routes take precedence on conflicts.
5. **Secrets and CLI files are blocked** at the server level (`config.json`,
   `config.php`, `bb.php`, `router.php`) and by `router.php` for the built-in
   server.
