---
title: Versioning
description: bulletinbored documentation
---
# Versioning

bulletinbored uses semantic versioning (SemVer): `MAJOR.MINOR.PATCH`. The current version is `1.0.0`.

The project is released under the BSD Zero Clause (BSD-0). See [LICENSE](https://github.com/bulletinbored/bulletinbored-core/blob/master/LICENSE) and [CLA.md](https://github.com/bulletinbored/bulletinbored-core/blob/master/CLA.md).

## What the numbers mean

- `MAJOR` — incremented for incompatible changes that require migration (e.g. config key renames, database schema breaks)
- `MINOR` — incremented for new features that are backward-compatible (e.g. new admin panels, new core hooks, new managers)
- `PATCH` — incremented for bug fixes and security patches that don't add features

The `1.0` API is stable. Incompatible changes require a major release, so a `1.x` minor or patch release is backward-compatible.

## Prereleases

Prereleases use a SemVer suffix such as `1.0.0-rc.1` or `1.0.0-beta.2`. Build metadata alone (`1.0.0+build.5`) does not make a version a prerelease.

- Prerelease updates are opt-in. Set `allow_prerelease_updates` to `true` in `config.json` to be offered them. A stable installation never receives a prerelease unless this key is enabled; an installation already running a prerelease may follow the next prerelease.
- GitHub's `/releases/latest` endpoint skips prereleases, so a GitHub-backed update check only sees stable releases unless the installation already follows prereleases.
- `bb_version_is_prerelease()` and `bb_version_base()` in `lib/Version.php` implement the checks. See `UpdateManager::isUpdateAllowed()` in `lib/UpdateManager.php` for the offer rules.
- Extension `core` constraints are matched against the base version: a plugin declaring `"core": ">=1.0.0"` is installable on `1.0.0-rc.1` because the suffix is stripped for requirement matching (`lib/PluginManager/PluginManifest.php`). Update comparisons keep the full version, so `1.0.0-rc.1` ranks below `1.0.0`.

## How to bump a version

1. Edit the `VERSION` file at the project root (single line, e.g. `1.0.0`)
2. Update the version in `config-sample.json` so it matches `VERSION`. `VersionConsistencyTest` asserts that `VERSION`, `config-sample.json` and the release notes agree.
3. If you ship updates via the Update Manager, make sure `versions.json` on your update mirror exposes the new version.
4. Tag the release in git:

   ```bash
   git add VERSION
   git commit -m "Bump version to 1.0.0"
   git tag 1.0.0
   git push --follow-tags
   ```

   Tags may carry an optional `v` prefix (`v1.0.0`); the release workflow and the updater normalize it before comparing.

## Where the version lives in code

- `VERSION`: single-source-of-truth file at the project root
- `config.json`: `version` is read from `config.json` at boot (`src/bootstrap.php`); the installer and the updater write it from `VERSION` (`install3.php`, `lib/UpdateManager.php`)
- `data/updates.json`: stores installed versions for core, plugins, and themes

## Version checks

The Update Manager compares installed versions with remote versions:

- Core version comes from `config['version']`
- Folder plugins declare their version in `manifest.json` (`lib/PluginDiscovery.php`). Legacy single-file plugins fall back to a `Version:` header.
- Theme versions come from `manifest.json` in each theme folder

`versions.json` is fetched from the configured `update_mirror`. `update_server`, when it points at a GitHub repository, is the fallback source and uses the GitHub Releases API, so no `versions.json` is required for that path (`lib/UpdateFetcher.php`).

## Example release checklist

1. Update `VERSION` file and `config-sample.json`
2. Update changelog / docs
3. Run the test suite (`php tests/run.php`), including `tests/ReleasePackageTest.php`
4. Commit and tag, then let `.github/workflows/release.yml` build and publish the package
5. Build the distribution archive locally if needed with `php tools/build-release.php`. The builder produces only the core archive; plugin and theme packages are separate.
6. Update remote `versions.json` on the update mirror pointing to the new packages (only for non-GitHub update servers)
