---
title: Manual Installation
description: Configure config.json manually instead of using the web installer.
---
# Manual Installation

If you prefer to configure `config.json` yourself instead of using the web installer, copy `config-sample.json` to `config.json` and set your database and site settings manually. Once `config.json` is in place, visiting the site will initialize the database on first access.

See [Configuration](configuration) for the full list of options.

`config-sample.json` contains the literal `__DIR__/data/database.sqlite` as `db_path`, but the runtime does not expand `__DIR__`. Replace it with a real absolute path to the SQLite file. The web installer does this for you: it resolves its default path to the actual server path and writes that value to `config.json`.

```json
// config.json
{
    "db_driver": "sqlite",
    "db_path": "/var/www/bulletinbored/data/database.sqlite",
    "site_name": "bulletinbored",
    "admin_user": "admin",
    "theme": "freshbored",
    "base_url": ""
}
```

`admin_pass` is optional here. It is read only on the first request, when no admin user exists yet. If you omit it, a temporary password is generated and written to the PHP error log with a `CHANGE THIS IMMEDIATELY` note, so set a strong value or check the log before logging in. `config.json` is hardened to mode `0600` by the application after boot.