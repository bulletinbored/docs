---
title: CLI & Migrations
description: bulletinbored documentation
---
# CLI & Migrations

bulletinbored ships with a zero-dependency CLI (`bb.php`) and a file-based migration system.

## CLI (`bb.php`)

Run commands from the forum root:

```bash
php bb.php <command> [options]
```

### Commands

| Command | Description |
|---|---|
| `migrate` | Run all pending migrations |
| `migrate:rollback` | Rollback the last batch of migrations |
| `migrate:status` | Show migration status (pending/ran) with source |
| `plugin:list` | List all plugins with version and status |
| `plugin:enable <name>` | Enable a plugin |
| `plugin:disable <name>` | Disable a plugin |
| `cache:flush` | Clear cache and session files |
| `doctor` | Run system diagnostics |
| `help` | Show help |

### Examples

```bash
# Check migration status
php bb.php migrate:status

# Run pending migrations
php bb.php migrate

# Rollback last batch
php bb.php migrate:rollback

# List plugins
php bb.php plugin:list

# Enable a plugin
php bb.php plugin:enable hellobored

# Flush caches
php bb.php cache:flush

# Run diagnostics
php bb.php doctor
```

> **Note**: the CLI requires a `config.json` file to be present in the forum root. If it is missing, the CLI exits with an error.

Example output of `php bb.php migrate:status`:

```
+--------------------------------+--------+-------+---------------------+
| Migration                      | Source | Batch | Ran At              |
+--------------------------------+--------+-------+---------------------+
| 20260829_initial_schema        | core   | 1     | 2026-08-29 14:40:01 |
| 20260830_add_user_bio          | core   | 2     | 2026-08-30 09:12:44 |
| 20260901_create_tags_table     | myplugin | 2   | 2026-09-01 10:00:00 |
| 20260902_add_custom_table      | myplugin | —   | pending             |
+--------------------------------+--------+-------+---------------------+
```

## Migration System (`lib/Migrator.php`)

### How It Works

1. **Migration files** live in `migrations/` directory
2. Each file has a `up()` and `down()` method
3. Applied migrations are tracked in the `migrations` table
4. Migrations run in batches — rollback reverses the last batch

### Creating a Migration

File naming convention: `YYYYMMDD_description.php`

```php
<?php
/**
 * Migration: 20260830_add_user_bio.php
 */

class AddUserBio
{
    public function up(PDO $pdo): void
    {
        $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);

        if ($driver === 'mysql') {
            $pdo->exec("ALTER TABLE users ADD COLUMN bio TEXT DEFAULT NULL");
        } else {
            $pdo->exec("ALTER TABLE users ADD COLUMN bio TEXT DEFAULT NULL");
        }
    }

    public function down(PDO $pdo): void
    {
        $driver = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);

        if ($driver === 'mysql') {
            $pdo->exec("ALTER TABLE users DROP COLUMN bio");
        } else {
            // SQLite supports DROP COLUMN only from version 3.35.0 (2021-03-12).
            // For maximum compatibility, recreate the table instead:
            $pdo->exec("CREATE TABLE users_new (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT NOT NULL,
                email TEXT
            )");
            $pdo->exec("INSERT INTO users_new (id, username, email) SELECT id, username, email FROM users");
            $pdo->exec("DROP TABLE users");
            $pdo->exec("ALTER TABLE users_new RENAME TO users");
        }
    }
}
```

### Class Name Convention

The class name is derived from the filename:

| Filename | Class Name |
|---|---|
| `20260830_add_user_bio.php` | `AddUserBio` |
| `20260901_create_tags_table.php` | `CreateTagsTable` |
| `20260101_fix_thread_status.php` | `FixThreadStatus` |

The date prefix (`YYYYMMDD_`) is stripped, then `snake_case` becomes `PascalCase`.

### Migration Batches

Migrations are grouped into batches. When you run `migrate`, all pending migrations get the same batch number. When you run `migrate:rollback`, all migrations from the last batch are reversed.

```
Batch 1: 20260829_initial_schema
Batch 2: 20260830_add_user_bio, 20260830_add_post_likes
Batch 3: 20260901_create_tags_table
```

Running `migrate:rollback` would reverse batch 3 only.

### The `doctor` Command

The `doctor` command runs a full system diagnostic, checking:

- **PHP version** — requires 8.1+
- **Extensions** — required (pdo, json, mbstring, fileinfo) and optional (zip, curl, gd)
- **Directory permissions** — verifies data, plugins, themes, migrations are writable
- **Database** — connection status and table count
- **Security** — display_errors, expose_php settings

```
=== bulletinbored diagnostics ===

  ✓ PHP version: 8.2.12
  ✓ Extension: pdo
  ✓ Extension: pdo_sqlite
  ✓ Extension: json
  ✓ Extension: mbstring
  ✓ Extension: fileinfo
  ✓ Extension: zip (optional)

Directory permissions:
  ✓ data: writable
  ✓ data/cache: writable
  ✓ plugins: writable
  ✓ themes: writable
  ✓ migrations: writable

Database:
  ✓ Driver: sqlite (database exists)
  ✓ Tables: 15

Security:
  ✓ display_errors is OFF
  ✓ expose_php is OFF

✓ All checks passed!
```

## Custom CLI Commands (Plugin API)

Plugins can register custom CLI commands via the `cli` hook:

```php
function myplugin_init() {
    global $pluginManager;
    
    $pluginManager->addHook('cli', function($registry) {
        $registry->register(
            'myplugin:clear',
            'Clear my plugin cache',
            function($args) {
                // Command logic
                echo "Cache cleared!\n";
            }
        );
    });
}
```

Usage: `php bb.php myplugin:clear`

The `$registry` object provides:

| Method | Description |
|---|---|
| `register($name, $description, $handler)` | Register a new command |
| `has($name)` | Check if a command exists |
| `$args` | Array of arguments passed after the command name |

### Best Practices

1. **Always make `down()` reversible** — if `up()` adds a column, `down()` should drop it
2. **Use `IF NOT EXISTS`** in `up()` for safety
3. **Handle both SQLite and MySQL** — check `$pdo->getAttribute(PDO::ATTR_DRIVER_NAME)`
4. **Never modify a published migration** — create a new one instead
5. **Never rename a migration that has already been run** — the `migrations` table tracks filenames; renaming breaks the tracking and would re-run the migration
6. **Test migrations** — run `migrate` then `migrate:rollback` to verify both directions

### Plugin Migrations

Plugins can provide their own migrations by creating a `migrations/` folder in their directory:

```
plugins/
  myplugin/
    migrations/
      20260829_add_my_table.php
    manifest.json
    myplugin.php
```

The `Migrator` automatically scans `plugins/*/migrations/` when running `bb migrate`. Plugin migrations are tracked alongside core migrations, with a `source` column indicating the origin (`core` or plugin folder name).

```php
// In bb.php — plugin paths are auto-discovered
$migrator->addPluginPaths(BB_ROOT . '/plugins');
```

You can also register custom migration paths manually:

```php
$migrator->addPath('/path/to/custom/migrations');
```

## File Structure

```
bulletinbored/
├── bb.php                    # CLI entry point (extensible command registry)
├── migrations/               # Core migrations
│   └── 20260829_initial_schema.php
├── lib/
│   └── Migrator.php          # Migration engine (supports plugin paths)
└── tests/
    ├── MigratorTest.php      # Migration tests
    └── E2eFlowTest.php       # End-to-end flow tests
```
