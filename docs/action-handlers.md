---
title: Action Handlers
description: Inventory of the core request handlers, their modules and the protections applied.
---
# Action Handlers

**Updated:** 2026-09-25 (version 0.9.0)

Core request handlers live in `src/actions/`. The top-level dispatcher files
(`posts.php`, `users.php`, `content.php`, `misc.php`, `admin.php`) are thin and
include the focused modules. Every handler now returns a `Bulletin\Response`
(or `bool` for legacy dispatching) instead of echoing and calling `die()`/`exit()`;
the router sends the response.

| Module | Lines | Responsibility |
|--------|-------|----------------|
| `src/actions/admin.php` | ~124 | Admin dispatcher + dashboard. |
| `src/actions/admin/settings.php` | ~145 | Site settings, SMTP, image upload. |
| `src/actions/admin/moderation.php` | ~225 | Moderate, front-moderate, split, merge. |
| `src/actions/admin/users.php` | ~212 | Roles, user CRUD, ban/unban/suspend. |
| `src/actions/admin/categories.php` | ~75 | Category CRUD and ordering. |
| `src/actions/admin/langs.php` | ~190 | Language management. |
| `src/actions/admin/plugins.php` | ~100 | Plugin management. |
| `src/actions/admin/themes.php` | ~89 | Theme management. |
| `src/actions/admin/catalog.php` | ~127 | Extension catalog. |
| `src/actions/admin/updates.php` | ~101 | Core/extension updates. |
| `src/actions/admin/diagnostics.php` | ~82 | System diagnostics (install requirements + PHP settings). |
| `src/actions/posts.php` | ~39 | Posts dispatcher. |
| `src/actions/posts-thread.php` | ~230 | Thread view, watch/unwatch, image upload. |
| `src/actions/posts-new.php` | ~89 | New thread creation. |
| `src/actions/posts-edit.php` | ~284 | Reply, edit/delete post, edit/delete thread. |
| `src/actions/users.php` | ~471 | Login, register, verify, profile, password reset. |
| `src/actions/content.php` | ~101 | Search, category view, download. |
| `src/actions/misc.php` | ~41 | Markdown preview, mention autocomplete. |

## Handler inventory

### Posts / threads (`posts-thread.php`, `posts-new.php`, `posts-edit.php`)

| Function | Signature |
|----------|-----------|
| `handle_thread_view()` | `(array $params = []): Response` |
| `handle_upload_image()` | `(): Response` |
| `handle_watch()` / `handle_unwatch()` | `(): Response` |
| `handle_new_thread()` | `(string $method): Response` |
| `handle_reply_post()` | `(): Response` |
| `handle_edit_post()` | `(string $method, array $params = []): Response` |
| `handle_edit_thread()` | `(string $method, array $params = []): Response` |
| `handle_delete_post()` | `(array $params = []): Response` |
| `handle_delete_thread()` | `(array $params = []): Response` |

### Users (`users.php`)

| Function | Signature |
|----------|-----------|
| `handle_login()` | `(string $method): Response` |
| `handle_register()` | `(string $method): Response` |
| `handle_logout()` | `(): Response` |
| `handle_verify_email()` | `(): Response` |
| `handle_profile()` | `(array $params = []): Response` |
| `handle_edit_profile()` | `(string $method): Response` |
| `handle_remove_avatar()` | `(string $method): Response` |
| `handle_forgot_password()` | `(string $method): Response` |
| `handle_reset_password()` | `(string $method): Response` |

### Content & misc (`content.php`, `misc.php`)

| Function | Signature |
|----------|-----------|
| `handle_search()` | `(): Response` |
| `handle_category()` | `(array $params = []): Response` |
| `handle_download()` | `(array $params = []): Response` |
| `handle_markdown_preview()` | `(): Response` |
| `handle_mention_users()` | `(): Response` |

### Admin (`admin.php` + `admin/*`)

| Function | Signature |
|----------|-----------|
| `handle_admin_dashboard()` | `(): Response` |
| `handle_admin_settings_get()` / `handle_admin_settings_post()` | `(): Response` / `(): ?string` |
| `handle_admin_smtp_get()` / `handle_admin_smtp_post()` | `(): Response` / `(): ?string` |
| `handle_admin_upload_site_image()` / `handle_admin_get_images()` | `(): Response` |
| `handle_admin_moderation_get()` | `(): Response` |
| `handle_moderate_post()` | `(array $params = []): Response` |
| `handle_frontend_moderate_post()` | `(): Response` |
| `handle_split_thread_post()` / `handle_merge_thread_post()` | `(): Response` |
| `handle_admin_roles_get()` / `handle_admin_roles_action_post()` | `(): Response` |
| `handle_admin_users_get()` / `handle_admin_user_edit()` | `(): Response` / `(string $method, array $params = []): Response` |
| `handle_admin_create_user_post()` / `handle_delete_user_post()` | `(): Response` |
| `handle_admin_ban_user_post()` / `handle_unban_user_post()` / `handle_suspend_user_post()` | `(): Response` |
| `handle_admin_categories()` / `handle_delete_category_post()` / `handle_update_category_order_post()` | `(): Response` |
| `handle_admin_langs()` | `(string $method)` |
| `handle_admin_diagnostics_get()` | `(): Response` |
| `handle_admin_plugins()` / `handle_admin_themes()` | `(string $method): Response` |
| `handle_admin_catalog()` | `(string $method): Response` |
| `handle_admin_updates()` | `(string $method): Response` |

## Protections

Every state-changing handler applies CSRF validation and (since 0.9.0) a rate
limit. Sensitive actions fail **closed** when the limiter cannot operate. The
rate-limit actions and windows are listed in
[Configuration → Rate Limiting](configuration#rate-limiting-security-hardening).

| Operation | CSRF | Auth | Rate limit | Authorization |
|-----------|------|------|------------|---------------|
| Login / register / password reset | yes | guest | yes | — |
| Create thread / reply | yes | auth | yes | category role check |
| Edit / delete post / thread | yes | auth | yes | owner or `AuthZ` (admin/mod) |
| Upload image / edit profile / remove avatar | yes | auth | yes | self |
| Watch / unwatch | yes | auth | yes | self |
| Admin settings / user / category / plugin / theme / update actions | yes | admin | yes | `admin` middleware |
| Moderate / split / merge | yes | auth | yes | `can:moderation.manage` |

## History

Earlier versions used 49 `die()` and 3 `exit()` calls in the handlers and
returned `bool` from every routing callback. That legacy control flow has been
removed; only `Response`-based returns (and a single binary-download path) remain.
