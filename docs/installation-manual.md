---
sidebar_position: 2
title: Manual Installation
description: Configure config.php manually instead of using the web installer.
---

# Manual Installation

If you prefer to configure `config.php` yourself instead of using the web installer, copy `config-sample.php` to `config.php` and set your database and site settings manually. Once `config.php` is in place, visiting the site will initialize the database on first access.

See [Configuration](configuration) for the full list of options.

```php
// config.php
$config = [
    'db_driver' => 'sqlite',
    'db_path' => __DIR__.'/data/database.sqlite',
    'site_name' => 'bulletinbored',
    'admin_user' => 'admin',
    'admin_pass' => 'changeme123',
    'theme' => 'freshbored',
    'base_url' => '',
];