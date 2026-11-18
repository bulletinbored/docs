---
title: Localization
description: bulletinbored documentation
---
# Localization (i18n)

The forum includes a basic translation system managed from the admin dashboard.

1. Create translation files in `lang/` (e.g., `lang/en.json`, `lang/it.json`)
2. Each file is a JSON object of key => translated string
3. Go to **Admin → Languages** to configure:
   - **Default Language**: the language used by default
   - **Available Languages**: derived from the installed `lang/*.json` files; the page saves the list it finds
4. Use `t('key')` in views and index.php to output translated strings

The forum ships with English (`lang/en.json`). Additional languages can be added as `lang/<code>.json` and enabled in **Admin → Languages** (see `views/admin_langs.php`).

## Translation File Format

Each language file is a JSON object mapping string keys to string values:

```json
{
    "site_name": "bulletinbored",
    "home": "Home",
    "login": "Login",
    "logout": "Logout"
}
```

Uploaded language files are validated as a JSON object of string keys/values; a PHP file is no longer accepted (translation files are parsed as data, never executed).

## Using Translations

In views and `index.php`:

```php
<?= t('home') ?>
```

With parameters:

```php
<?= t('reply_notification_subject', ['title' => $threadTitle]) ?>
```

Plugins and themes can ship their own translations and read them through scoped helpers:

```php
// plugins/editbored/lang/en.json -> pt('editbored', 'bold')
<?= pt('editbored', 'bold') ?>

// themes/freshbored/lang/en.json -> tt('freshbored', 'some_key')
<?= tt('freshbored', 'some_key') ?>
```

A plugin reads `plugins/<folder>/lang/<lang>.json`; a theme reads `themes/<folder>/lang/<lang>.json`. The files are loaded into separate `plugin:<name>` and `theme:<name>` scopes before plugin init hooks run (`src/bootstrap.php`, `lib/PluginManager.php`, `lib/ThemeManager.php`).

## Managing Languages

- Upload a new language as a single `.json` file from **Admin → Languages** (`views/admin_langs.php`). A ZIP is not accepted.
- Install or update a language from the official remote repository: enter the language code and a repository download URL. Only URLs from the official language repository (GitHub `bulletinbored/langs`) or the configured language mirror are allowed, and the downloaded content must be a valid JSON object (`src/actions/admin/langs.php`).
- Delete installed language files from **Admin → Languages** (except the default language).
