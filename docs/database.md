---
title: Database Layer
description: DbQuery — lightweight query builder over PDO/BbPdo.
---
# Database Layer

`lib/DbQuery.php` provides a lightweight query builder over PDO (works with `BbPdo` for SQLite/MySQL portability). No ORM, no magic — just sugar over prepared statements.

## Basic Usage

```php
$db = new DbQuery($pdo);

// SELECT
$user = $db->table('users')->where('id', 42)->first();
$threads = $db->table('threads')
    ->where('status', 'visible')
    ->orderBy('created_at', 'DESC')
    ->limit(10)
    ->get();

// INSERT
$newId = $db->table('users')->insert([
    'username' => 'alice',
    'email' => 'alice@example.com'
]);

// UPDATE
$db->table('users')->where('id', 42)->update([
    'email' => 'new@example.com'
]);

// DELETE
$db->table('users')->where('status', 'banned')->delete();
```

## Method Reference

### Query Building

| Method | Description |
|---|---|
| `table($table)` | Set target table (returns clone, immutable) |
| `select(...$cols)` | Specify columns (default: `*`) |
| `where($column, $value, $op = '=')` | Add WHERE clause |
| `whereIn($column, $values)` | Add WHERE IN clause |
| `whereRaw($sql, $params)` | Add raw WHERE clause |
| `orderBy($column, $direction = 'ASC')` | Add ORDER BY |
| `limit($limit)` | Set LIMIT |
| `offset($offset)` | Set OFFSET |

### Execution

| Method | Returns |
|---|---|
| `get()` | array (all rows) |
| `first()` | ?array (single row or null) |
| `count()` | int |
| `exists()` | bool |
| `pluck($column)` | array (single column values) |
| `paginate($perPage, $page = 1)` | array (`items`, `total`, `per_page`, `current_page`, `last_page`) |

### Write Operations

| Method | Returns |
|---|---|
| `insert(array $data)` | int (last insert ID) |
| `insertIgnore(array $data)` | int (SQLite: INSERT OR IGNORE, MySQL: INSERT IGNORE) |
| `update(array $data)` | int (affected rows) |
| `delete()` | int (affected rows) |

### Raw Queries

| Method | Returns |
|---|---|
| `raw($sql, $params)` | array |
| `rawFirst($sql, $params)` | ?array |
| `rawExec($sql, $params)` | int (affected rows) |

## Pagination

```php
$page = $db->table('threads')
    ->where('category_id', 5)
    ->orderBy('created_at', 'DESC')
    ->paginate(15, max(1, (int)($_GET['page'] ?? 1)));

// Returns:
// [
//     'items' => [...],
//     'total' => 42,
//     'per_page' => 15,
//     'current_page' => 1,
//     'last_page' => 3
// ]
```

## Immutability

All query builder methods return a **clone** of the instance, so you can branch queries. This includes `first()`, `pluck()`, and `paginate()`:

```php
$baseQuery = $db->table('threads')->where('status', 'visible');

$count = $baseQuery->count();           // doesn't affect $baseQuery
$latest = $baseQuery->orderBy('created_at', 'DESC')->limit(5)->get();
```

## Integration with BbPdo

`DbQuery` accepts any PDO instance. When used with `BbPdo`, SQL is automatically normalized for the active driver (SQLite ↔ MySQL):

```php
// In setup.php — BbPdo handles driver differences
$pdo = new BbPdo($dsn, $user, $pass);
$db = new DbQuery($pdo);

// This works on both SQLite and MySQL:
$db->table('roles')->insertIgnore(['name' => 'admin', 'permissions' => '{}']);
```
