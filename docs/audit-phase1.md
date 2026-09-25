---
title: Phase 1 Audit (historical)
description: Snapshot of the 0.6.0 architecture audit — retained as a historical record.
---
# Phase 1 Audit Report — 0.6.0 (historical)

> **Historical document.** This was a read-only audit performed on version
> **0.6.0** (2026-08-31) to plan the stabilization work. It is retained for
> reference only: the findings below were addressed in later releases and the
> current state is documented in [Route Map](routes),
> [Action Handlers](action-handlers), [Architecture](architecture) and
> [Security Model](security). Do not read this page as current behaviour.

**Date:** 2026-08-31 · **Scope:** audit all routes, mutations, HTTP termination
and authorization across the 0.6.0 tree.

## Route inventory

The audit catalogued 68 routes: public frontend, guest-only auth, authenticated
user, admin, permission-based moderation, plugin routes and standalone
installer/API entrypoints. The maintained, current inventory lives in the
[Route Map](routes).

## Mutation inventory (gaps at the time)

All state-changing operations were already CSRF- and auth-protected, but the
audit flagged:

- **No rate limiting** on edit/delete post/thread, profile edits, or any admin
  operation.
- **No ownership check via `AuthZ`** on edit/delete post/thread — inline
  `is_admin()` + owner comparison instead.
- **No permission check** on watch/unwatch (only `is_logged_in()`).

> **Status today:** every mutation is rate-limited (sensitive actions fail
> closed); ownership checks go through `AuthZ::canOnOwned()`; watch/unwatch are
> authenticated POST routes.

## Direct HTTP termination inventory

The audit found **49 `die()` calls and 3 `exit()` calls** in request handlers
(legacy control flow bypassing the Response object and error pipeline), plus
direct `echo`/`header()` in JSON endpoints.

> **Status today:** handlers return `Bulletin\Response`; the only remaining
> `exit` is the binary download path in `content.php` after `readfile()`.

## Authorization inventory

- Admin middleware checked `$_SESSION['user_role']` directly.
- Post/thread ownership used inline `is_admin()` comparisons.
- `user_has_permission()` was unused.

> **Status today:** `AuthZ` is registered with the router (`can:` middleware),
> ownership uses `canOnOwned()`, and the unused `user_has_permission()` helper
> has been removed.

## Findings and resolution

| # | Finding (0.6.0) | Severity | Resolution |
|---|-----------------|----------|------------|
| 1 | 49 `die()` calls in handlers | P0 | Replaced by `Bulletin\Response` returns. |
| 2 | 3 `exit()` calls in reset-password flow | P0 | Removed. |
| 3 | No `AuthZ` integration for ownership | P0 | `AuthZ::canOnOwned()` + `can:` middleware. |
| 4 | Admin middleware used `$_SESSION['user_role']` | P0 | `AuthZ::can('admin.access')`. |
| 5 | No rate limiting on edit/delete/admin | P1 | Rate limiter extended to all mutations. |
| 6 | Direct `echo`/`header()` in JSON endpoints | P1 | `Response::json()` factories. |
| 7 | Redundant `is_admin()` guards behind admin middleware | P1 | Removed / delegated to middleware. |
| 8 | Category role checks used `$_SESSION['user_role']` | P1 | Routed through `AuthZ`. |
| 9 | `Router::sendResponse()` emits headers directly | P2 | Accepted as the single infrastructure sink. |
| 10 | Plugin hook fallback bypassed Response | P2 | Documented. |

## Exit criteria (as assessed at the time)

| Criterion | Status |
|-----------|--------|
| Complete route inventory | DONE — 68 routes documented |
| Complete mutation inventory | DONE — 37 mutations documented |
| Complete authorization inventory | DONE |
| Complete legacy `die()/exit()` inventory | DONE — 49 `die()`, 3 `exit()` |
| No new architecture introduced | DONE — audit only, no code changes |
