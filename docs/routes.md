---
title: Route Map
description: Complete inventory of HTTP routes, handlers, middleware and plugin entrypoints.
---
# Route Map

**Updated:** 2026-09-25 (version 0.9.0)

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
| 1 | GET | `/` | closure (`fetch_threads` + `views/home.php`) | `index.php:94` |
| 2 | GET | `/thread/{id:\d+}` | `handle_thread_view()` | `index.php:108` |
| 3 | GET | `/thread/{id:\d+}-{slug}` | `handle_thread_view()` | `index.php:109` |
| 4 | GET | `/category/{id:\d+}` | `handle_category()` | `index.php:110` |
| 5 | GET | `/category/{id:\d+}-{slug}` | `handle_category()` | `index.php:111` |
| 6 | GET | `/u/{user}` | `handle_profile()` | `index.php:112` |
| 7 | GET | `/search` | `handle_search()` | `index.php:113` |
| 8 | GET | `/download/{id:\d+}` | `handle_download()` | `index.php:114` |

## 2. Auth (middleware: `guest`)

| # | Method | Path | Handler | File |
|---|--------|------|---------|------|
| 9 | GET | `/login` | `handle_login('GET')` | `index.php:118` |
| 10 | POST | `/login` | `handle_login('POST')` | `index.php:119` |
| 11 | GET | `/register` | `handle_register('GET')` | `index.php:120` |
| 12 | POST | `/register` | `handle_register('POST')` | `index.php:121` |
| 13 | GET | `/forgot-password` | `handle_forgot_password('GET')` | `index.php:122` |
| 14 | POST | `/forgot-password` | `handle_forgot_password('POST')` | `index.php:123` |
| 15 | GET | `/reset-password` | `handle_reset_password('GET')` | `index.php:124` |
| 16 | POST | `/reset-password` | `handle_reset_password('POST')` | `index.php:125` |

## 3. Email verification (no middleware)

| # | Method | Path | Handler | File |
|---|--------|------|---------|------|
| 17 | GET | `/verify-email` | `handle_verify_email()` | `index.php:129` |

## 4. Authenticated user (middleware: `auth`)

| # | Method | Path | Handler | File |
|---|--------|------|---------|------|
| 18 | GET | `/new-thread` | `handle_new_thread('GET')` | `index.php:133` |
| 19 | POST | `/new-thread` | `handle_new_thread('POST')` | `index.php:134` |
| 20 | POST | `/reply` | `handle_reply_post()` | `index.php:135` |
| 21 | GET | `/edit-post/{id:\d+}` | `handle_edit_post('GET')` | `index.php:136` |
| 22 | POST | `/edit-post/{id:\d+}` | `handle_edit_post('POST')` | `index.php:137` |
| 23 | POST | `/delete-post/{id:\d+}` | `handle_delete_post()` | `index.php:138` |
| 24 | GET | `/edit-thread/{id:\d+}` | `handle_edit_thread('GET')` | `index.php:139` |
| 25 | POST | `/edit-thread/{id:\d+}` | `handle_edit_thread('POST')` | `index.php:140` |
| 26 | POST | `/delete-thread/{id:\d+}` | `handle_delete_thread()` | `index.php:141` |
| 27 | POST | `/watch` | `handle_watch()` | `index.php:142` |
| 28 | POST | `/unwatch` | `handle_unwatch()` | `index.php:143` |
| 29 | POST | `/upload-image` | `handle_upload_image()` | `index.php:144` |
| 30 | POST | `/logout` | `handle_logout()` | `index.php:145` |
| 31 | GET | `/edit-profile` | `handle_edit_profile('GET')` | `index.php:146` |
| 32 | POST | `/edit-profile` | `handle_edit_profile('POST')` | `index.php:147` |
| 33 | POST | `/remove-avatar` | `handle_remove_avatar('POST')` | `index.php:148` |
| 34 | POST | `/preview` | `handle_markdown_preview()` | `index.php:149` |
| 35 | GET | `/mention-users` | `handle_mention_users()` | `index.php:150` |

## 5. Admin (middleware: `admin`)

| # | Method | Path | Handler | File |
|---|--------|------|---------|------|
| 36 | GET | `/admin` | `handle_admin_dashboard()` | `index.php:155` |
| 37 | GET | `/admin/settings` | `handle_admin_settings_get()` | `index.php:156` |
| 38 | POST | `/admin/settings` | `handle_admin_settings_post()` | `index.php:157` |
| 39 | GET | `/admin/smtp` | `handle_admin_smtp_get()` | `index.php:158` |
| 40 | POST | `/admin/smtp` | `handle_admin_smtp_post()` | `index.php:159` |
| 41 | POST | `/admin/upload-site-image` | `handle_admin_upload_site_image()` | `index.php:160` |
| 42 | GET | `/admin/get-images` | `handle_admin_get_images()` | `index.php:161` |
| 43 | GET | `/admin/moderation` | `handle_admin_moderation_get()` | `index.php:162` |
| 44 | POST | `/admin/moderate` | `handle_moderate_post()` | `index.php:163` |
| 45 | POST | `/admin/front-moderate` | `handle_frontend_moderate_post()` | `index.php:164` |
| 46 | POST | `/admin/split-thread` | `handle_split_thread_post()` | `index.php:165` |
| 47 | POST | `/admin/merge-thread` | `handle_merge_thread_post()` | `index.php:166` |
| 48 | GET | `/admin/roles` | `handle_admin_roles_get()` | `index.php:167` |
| 49 | POST | `/admin/roles-action` | `handle_admin_roles_action_post()` | `index.php:168` |
| 50 | GET | `/admin/users` | `handle_admin_users_get()` | `index.php:169` |
| 51 | GET | `/admin/users/{id:\d+}/edit` | `handle_admin_user_edit('GET')` | `index.php:170` |
| 52 | POST | `/admin/users/{id:\d+}/edit` | `handle_admin_user_edit('POST')` | `index.php:171` |
| 53 | POST | `/admin/create-user` | `handle_admin_create_user_post()` | `index.php:172` |
| 54 | GET | `/admin/categories` | `handle_admin_categories('GET')` | `index.php:173` |
| 55 | POST | `/admin/categories` | `handle_admin_categories('POST')` | `index.php:174` |
| 56 | POST | `/admin/delete-category` | `handle_delete_category_post()` | `index.php:175` |
| 57 | POST | `/admin/update-category-order` | `handle_update_category_order_post()` | `index.php:176` |
| 58 | GET | `/admin/langs` | `handle_admin_langs('GET')` | `index.php:177` |
| 59 | POST | `/admin/langs` | `handle_admin_langs('POST')` | `index.php:178` |
| 60 | GET | `/admin/diagnostics` | `handle_admin_diagnostics_get()` | `index.php:179` |
| 61 | GET | `/admin/plugins` | `handle_admin_plugins('GET')` | `index.php:180` |
| 62 | POST | `/admin/plugins` | `handle_admin_plugins('POST')` | `index.php:181` |
| 63 | GET | `/admin/themes` | `handle_admin_themes('GET')` | `index.php:182` |
| 64 | POST | `/admin/themes` | `handle_admin_themes('POST')` | `index.php:183` |
| 65 | GET | `/admin/catalog` | `handle_admin_catalog('GET')` | `index.php:184` |
| 66 | POST | `/admin/catalog` | `handle_admin_catalog('POST')` | `index.php:185` |
| 67 | GET | `/admin/updates` | `handle_admin_updates('GET')` | `index.php:186` |
| 68 | POST | `/admin/updates` | `handle_admin_updates('POST')` | `index.php:187` |
| 69 | POST | `/admin/delete-user` | `handle_delete_user_post()` | `index.php:188` |
| 70 | POST | `/admin/ban-user` | `handle_ban_user_post()` | `index.php:189` |
| 71 | POST | `/admin/unban-user` | `handle_unban_user_post()` | `index.php:190` |
| 72 | POST | `/admin/suspend-user` | `handle_suspend_user_post()` | `index.php:191` |

## 6. Permission-based route (moderators + admins)

| # | Method | Path | Handler | File |
|---|--------|------|---------|------|
| 73 | POST | `/moderate/{id:\d+}` | `handle_moderate_post()` | `index.php:197` |

Registered with `middleware('auth')` → `middleware('can:moderation.manage')`.

## 7. Plugin routes (via Router)

Plugins register routes through `PluginManager::registerRoute()` and they are
applied before the core routes. Bundled examples:

| # | Method | Path | Handler | File |
|---|--------|------|---------|------|
| 74 | GET | `/notifications` | `bellbored_handle_page('GET')` | `plugins/bellbored/bellbored.php` |
| 75 | POST | `/notifications` | `bellbored_handle_page('POST')` | `plugins/bellbored/bellbored.php` |
| 76 | GET | `/messages` | `textmebored_handle_page('GET')` | `plugins/textmebored/textmebored.php` |
| 77 | POST | `/messages` | `textmebored_handle_page('POST')` | `plugins/textmebored/textmebored.php` |

## 8. Plugin standalone endpoints (direct access, bypass the router)

These files are hit directly (e.g. by plugin JavaScript) and bootstrap the
application themselves. They perform their own session, CSRF and rate-limit
checks.

| # | Method | Path | Notes |
|---|--------|------|-------|
| 78 | GET/POST | `/plugins/bellbored/api.php` | Notification count/list/mark-read |
| 79 | GET/POST | `/plugins/textmebored/api.php` | Conversations, messages, search |
| 80 | GET/POST | `/plugins/updownbored/api.php` | Post scores and votes |
| 81 | POST | `/plugins/editbored/upload.php` | Editor image upload |
| 82 | GET | `/plugins/sitemapbored/sitemap.php` | Public XML sitemap (throttled) |

## 9. Installer (direct access)

The installer is reachable on a fresh deployment and refuses to run once
`config.json` exists.

| # | Method | Path | File |
|---|--------|------|------|
| 83 | GET/POST | `/install.php` | `install.php` |
| 84 | GET/POST | `/install2.php` | `install2.php` |
| 85 | GET/POST | `/install3.php` | `install3.php` |

## 10. API endpoints (direct access)

| # | Method | Path | Notes |
|---|--------|------|-------|
| 86 | POST | `/api/install.php` | Install a plugin/theme from the catalog (admin only) |

## Summary by area

| Area | Count |
|------|-------|
| Public frontend | 8 |
| Auth | 8 |
| Email verification | 1 |
| Authenticated user | 18 |
| Admin | 37 |
| Permission-based | 1 |
| Plugin via router | 4 |
| Plugin standalone | 5 |
| Installer | 3 |
| API | 1 |
| **TOTAL** | **86 core + plugin entrypoints** |

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
