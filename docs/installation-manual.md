---
title: Manual Installation
description: Configure config.json manually instead of using the web installer.
---
# Manual Installation

If you prefer to configure `config.json` yourself instead of using the web installer, copy `config-sample.json` to `config.json` and set your database and site settings manually. Once `config.json` is in place, visiting the site will initialize the database on first access.

See [Configuration](configuration) for the full list of options.

```json
// config.json
{
    "db_driver": "sqlite",
    "db_path": "__DIR__/data/database.sqlite",
    "site_name": "bulletinbored",
    "admin_user": "admin",
    "admin_pass": "changeme123",
    "theme": "freshbored",
    "base_url": ""
}
```