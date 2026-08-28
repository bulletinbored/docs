---
title: Localization
description: bulletinbored documentation
---
# Localization (i18n)

The forum includes a basic translation system managed from the admin dashboard.

1. Create translation files in `lang/` (e.g., `lang/en.json`, `lang/it.json`)
2. Each file is a JSON object of key => translated string
3. Go to **Admin Panel → Settings** to configure:
   - **Default Language**: the language used by default
   - **Available Languages**: comma-separated list of enabled language codes
4. Use `t('key')` in views and index.php to output translated strings

The forum ships with English (`lang/en.json`) and Italian (`lang/it.json`) translations.

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

## Managing Languages

- Upload new language files from **Admin Panel → Languages**
- Delete installed language files from **Admin Panel → Languages** (except the default language)
- Language files can also be uploaded via ZIP from the Plugin Manager if they're bundled as part of a localization pack
