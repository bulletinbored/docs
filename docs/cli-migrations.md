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
            // SQLite doesn't support DROP COLUMN in older versions
            // Would need to recreate the table
            $pdo->exec("ALTER TABLE users DROP COLUMN bio");
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
5. **Test migrations** — run `migrate` then `migrate:rollback` to verify both directions

### Plugin Migrations

Plugins can include their own migrations in `plugins/{name}/migrations/`. The Migrator can be extended to scan plugin directories:

```php
// In your plugin's init():
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
