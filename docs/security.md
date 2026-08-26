---
title: Security Model
description: Trust model, known risks, and hardening options for bulletinbored.
---
# Security Model

bulletinbored is built for a **single trusted administrator** who installs plugins,
themes, language packs, and updates. The security model therefore assumes that
installing code is a deliberate act of trust in its source (the author / the
repository).

## What is hardened

- **Zip Slip is mitigated everywhere a package is extracted.** `PluginManager`,
  `ThemeManager`, `UpdateManager`, and the shared `extract_zip()` all validate every
  archive entry and reject `..` path traversal and absolute paths before writing.
- **Language packs are JSON and never executed.** Uploaded or installed translation
  files are parsed as plain data (string → string), so a malicious language file
  cannot lead to remote code execution.
- **User content is sanitized.** HTML saved by the editor is filtered by
  `sanitize_html()`: scripts/styles are stripped, generic `div`/`span`, `id`, inline
  `style`, and arbitrary `data-*` attributes are removed, and event handlers
  (`on*`) are dropped. Output is served under a per-request nonce-based CSP. Social
  embeds (YouTube, Twitter/X, Instagram, Facebook) are permitted only from a fixed
  host allow-list.
- **Installer files do not re-appear after a core update.** `applyCoreUpdate()`
  removes `install.php`, `install2.php`, `install3.php`, and `api/install.php` from a
  deployed root once the forum is installed (`config.json` present). On a fresh
  install (no `config.json`) the scripts are kept so setup can run.

## Installing code is an act of trust

Plugins and themes are PHP code that is `include`d by the forum. A malicious package
therefore means **remote code execution**. Because distribution is **decentralized**
(anyone can publish a plugin/theme on any Git host), there is **no central signing
authority** and bulletinbored does **not** implement cryptographic signature
verification of packages.

Consequences for the operator:

- Installing or updating a plugin/theme means you trust its **author and its source**.
  This is by design for a decentralized ecosystem. There is no "safe" automatic path:
  even when a package comes from the curated catalog, an **update** applies a new
  package from that same source without a human re-reviewing the diff. You cannot
  pre-approve updates in a meaningful way without trusting the source — doing so
  would undermine the decentralized nature of the system.
- As defense-in-depth, keep `plugin_verify_files` / `theme_verify_files` **enabled**
  (on by default). At install time the package is checked against the `files` list in
  its `manifest.json`; a package that ships files not declared in the manifest
  (e.g. a dropped-in backdoor) is rejected. Note: this catches *added* files, not a
  manifest that itself was updated to include the malicious file — so it is a guard,
  not a guarantee.
- `catalog-only` mode (`allow_catalog_only`) restricts installation to `official:
  true` entries from the curated catalog. It reduces the set of sources to curated
  ones, but it does **not** give you pre-approval of updates: a curated source can
  still publish a new version at any time.

### Curated catalog: first-party vs third-party

The catalog mixes components developed by the bulletinbored team (**first-party**)
and components developed by the community (**third-party**). The catalog UI labels
each one accordingly ("Developed by bulletinbored team" vs "Developed by third party")
so you can see at a glance what is first-party and what is not.

Every catalog entry — first-party or third-party — is **reviewed by the bulletinbored
team before being added to the catalog**. Even so, bulletinbored does **not** assume
any responsibility for the code, security, or behavior of third-party plugins/themes:
installing one remains an act of trust in its author. If a third-party (or first-party)
component is later found to be malicious, bulletinbored will remove it from the catalog
as soon as it is reported by a user — see [Reporting](#reporting) below.

> The pre-catalog review reduces risk but is not a guarantee: a component can be
> compromised after publication (e.g. via an update), and reviews are best-effort.
> Keep `*_verify_files` enabled and treat any installation as trusting the source.

> **Bottom line:** only install plugins/themes/updates from sources you trust. Keep
> `*_verify_files` enabled, prefer `catalog-only` mode if you want a smaller trusted
> surface, and review third-party code before deploying it on a production forum with
> untrusted users.

## Hardening options in `config.json`

| Key | Default | Effect |
|---|---|---|
| `plugin_verify_files` | `true` | Reject plugin packages whose extracted files don't match `manifest.json` `files`. |
| `theme_verify_files` | `true` | Same check for themes. |
| `allow_catalog_only` | `false` | When `true`, only `official: true` catalog entries can be installed. |

See [Configuration](configuration#security-hardening) for details.

## Reporting

If you encounter a malicious or problematic plugin/theme, report it on the official
forum: **www.bulletinbored.net/forum**.
