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
| `table($table)` | Set target table (returns clone) |
| `select(...$cols)` | Specify columns (default: `*`) |
| `where($column, $value, $op = '=')` | Add WHERE clause |
| `whereIn($column, $values)` | Add WHERE IN clause |
| `whereNull($column)` | Add `column IS NULL` |
| `whereNotNull($column)` | Add `column IS NOT NULL` |
| `whereBetween($column, $min, $max)` | Add `column BETWEEN min AND max` (both bound) |
| `whereRaw($sql, $params)` | Add raw WHERE clause |
| `join($table, $first, $operator, $second)` | Add INNER JOIN |
| `leftJoin($table, $first, $operator, $second)` | Add LEFT JOIN |
| `orderBy($column, $direction = 'ASC')` | Add ORDER BY |
| `limit($limit)` | Set LIMIT |
| `offset($offset)` | Set OFFSET |

### Identifier and operator allow-lists

Table and column identifiers must match `[A-Za-z_][A-Za-z0-9_]*` with an
optional `.table` qualifier. `select()` additionally accepts `*`, `table.*` and
a simple column alias; `orderBy()` accepts a plain or qualified column.
`where()`, `join()` and `leftJoin()` accept
only these operators: `=`, `!=`, `<>`, `<`, `<=`, `>`, `>=`, `LIKE`, `NOT LIKE`,
`IS`, `IS NOT`. Anything else throws `InvalidArgumentException`
(`lib/DbQuery.php:38,55-100,196-252`). Expressions and functions inside
`select()` are rejected; use `raw()` / `rawFirst()` for those.

`where()` also normalises `NULL`: `where('deleted_at', null)` becomes
`deleted_at IS NULL`, and `!= null` / `<> null` / `IS NOT null` become
`column IS NOT NULL` (`lib/DbQuery.php:124-145`).

### Execution

| Method | Returns |
|---|---|
| `get()` | array (all rows) |
| `first()` | ?array (single row or null) |
| `count()` | int (number of rows the query returns) |
| `exists()` | bool |
| `pluck($column)` | array (single column values) |
| `paginate($perPage, $page = 1)` | array (`items`, `total`, `per_page`, `current_page`, `last_page`) |

`count()` runs `SELECT COUNT(*)` with the query's joins and WHERE clauses, so
with a join it counts **joined rows**, not distinct rows of the main table: a
`threads LEFT JOIN posts` count includes one row per post (and one for a thread
with no posts). Use `rawFirst('SELECT COUNT(DISTINCT threads.id) FROM ...')`
when a distinct count is needed (`lib/DbQuery.php:330-344`).

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

Builder methods (`table()`, `select()`, `where()`, `whereIn()`, `whereNull()`,
`whereNotNull()`, `whereBetween()`, `whereRaw()`, `join()`, `leftJoin()`,
`orderBy()`, `limit()`, `offset()`) return a **clone** of the instance, so you
can branch queries:

```php
$baseQuery = $db->table('threads')->where('status', 'visible');

$count = $baseQuery->count();           // doesn't affect $baseQuery
$latest = $baseQuery->orderBy('created_at', 'DESC')->limit(5)->get();
```

The execution methods do **not** return a builder: `first()` returns `?array`,
`pluck()` returns an array of values, and `paginate()` returns a result array
(`lib/DbQuery.php:322-328,463-490`). They clone internally and do not mutate the
query you call them on.

## Integration with BbPdo

`DbQuery` accepts any PDO instance. When used with `BbPdo`, SQL is automatically normalized for the active driver (SQLite ↔ MySQL):

```php
// In setup.php — BbPdo handles driver differences
$pdo = new BbPdo($dsn, $user, $pass);
$db = new DbQuery($pdo);

// This works on both SQLite and MySQL:
$db->table('roles')->insertIgnore(['name' => 'admin', 'permissions' => '{}']);
```
