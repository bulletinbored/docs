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
| `migrate:status` | Show migration status (pending/ran) |
| `plugin:list` | List all plugins with version and status |
| `plugin:enable <name>` | Enable a plugin |
| `plugin:disable <name>` | Disable a plugin |
| `cache:flush` | Clear cache and session files |
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
```

> **Note**: the CLI requires a `config.json` file to be present in the forum root. If it is missing, the CLI exits with an error.

Example output of `php bb.php migrate:status`:

```
+--------------------------------+-------+---------------------+
| Migration                      | Batch | Ran At              |
+--------------------------------+-------+---------------------+
| 20260829_initial_schema        | 1     | 2026-08-29 14:40:01 |
| 20260830_add_user_bio          | 2     | 2026-08-30 09:12:44 |
| 20260901_create_tags_table     | —     | pending             |
+--------------------------------+-------+---------------------+
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

### The `migrations` Table

| Column | Type | Description |
|---|---|---|
| `id` | INTEGER | Primary key |
| `migration` | TEXT | Migration filename (without .php) |
| `batch` | INTEGER | Batch number |
| `ran_at` | DATETIME | When it was run |

### Best Practices

1. **Always make `down()` reversible** — if `up()` adds a column, `down()` should drop it
2. **Use `IF NOT EXISTS`** in `up()` for safety
3. **Handle both SQLite and MySQL** — check `$pdo->getAttribute(PDO::ATTR_DRIVER_NAME)`
4. **Never modify a published migration** — create a new one instead
5. **Never rename a migration that has already been run** — the `migrations` table tracks filenames; renaming breaks the tracking and would re-run the migration
6. **Test migrations** — run `migrate` then `migrate:rollback` to verify both directions

### Plugin Migrations

> **Status in 0.5.0**: plugin migrations are **not yet supported automatically**. The `Migrator` scans only the core `migrations/` directory. The example below is a **proposal** for a future release — the `migrate` hook is not implemented in the core yet.

Plugins that need schema changes in 0.5.0 must either:

- Ship their schema changes as part of their own setup code (e.g. run `CREATE TABLE IF NOT EXISTS` on first load), or
- Coordinate with the forum administrator to add a core migration.

The following pattern is planned for a future release, where plugins can include their own migrations in `plugins/{name}/migrations/`:

```php
// In your plugin's init() — NOT YET SUPPORTED in 0.5.0:
$pm->addHook('migrate', function() use ($pdo) {
    $pluginMigrator = new Migrator($pdo, $config, __DIR__ . '/migrations');
    $pluginMigrator->migrate();
});
```

## File Structure

```
bulletinbored/
├── bb.php                    # CLI entry point
├── migrations/               # Core migrations
│   └── 20260829_initial_schema.php
├── lib/
│   └── Migrator.php          # Migration engine
└── tests/
    └── MigratorTest.php      # Migration tests
```
