---
title: Testing
description: bulletinbored documentation
---
# Testing

bulletinbored ships with a **zero-dependency test suite** — no PHPUnit, no Composer, no Docker. Just plain PHP you run from the CLI.

## Quick Start

```bash
# Run all tests
php tests/run.php

# Run a specific test file
php tests/run.php DbQuery
php tests/run.php E2eFlow
php tests/run.php PluginManager
php tests/run.php Auth
php tests/run.php Migrator
php tests/run.php Security
php tests/run.php Response
php tests/run.php Markdown
php tests/run.php PluginRouter

# Verbose output
php tests/run.php --verbose
```

## Test Structure

```
tests/
├── harness.php           # Test + TestSuite classes (the engine)
├── run.php               # CLI runner
├── DbQueryTest.php       # DbQuery (query builder) tests
├── E2eFlowTest.php       # End-to-end flow tests (thread lifecycle, JSON API, plugins)
├── PluginManagerTest.php # Hook system + manifest validation tests
├── AuthTest.php          # Auth, permissions, CSRF, AuthZ tests
├── MigratorTest.php      # Migration engine tests
├── SecurityTest.php      # CSRF rotation, Request, audit log, trusted proxies tests
├── ResponseTest.php      # Response object + typed Request tests
├── MarkdownTest.php      # Markdown security tests (XSS, URL schemes)
└── PluginRouterTest.php  # Plugin route/middleware registration tests
```

## Harness API (`tests/harness.php`)

### Class `Test`

Represents a group of assertions. All methods record pass/fail and print results on `run()`.

```php
$t = new Test('My Feature');

// Generic assertion
$t->assert('description', $condition === true);

// Typed assertions
$t->assertEquals('description', $expected, $actual);  // === comparison
$t->assertNotEquals('description', $unexpected, $actual);
$t->assertTrue('description', $value);
$t->assertFalse('description', $value);
$t->assertNull('description', $value);
$t->assertNotNull('description', $value);
$t->assertCount('description', $expectedCount, $array);
$t->assertContains('description', $needle, $array);
$t->assertInstanceOf('description', 'ClassName', $object);

// Run and print results
$t->run();
```

### Class `TestSuite`

Aggregates multiple `Test` instances and reports totals.

```php
$suite = new TestSuite();
$suite->addTest($test1);
$suite->addTest($test2);
$suite->run();  // exits with code 1 if any test failed
```

## Writing Tests

### Pattern

Each test file defines functions that return a `Test` object:

```php
<?php
/**
 * Feature tests — tests for a specific component.
 */

require_once __DIR__ . '/../lib/YourClass.php';

function test_feature_behavior(): Test
{
    $t = new Test('Feature - Behavior');

    // Setup
    $instance = new YourClass();

    // Execute
    $result = $instance->doSomething();

    // Assert
    $t->assert('Method returns expected result', $result === 'expected');

    return $t;
}

function test_feature_edge_case(): Test
{
    $t = new Test('Feature - Edge Case');

    // Test empty input
    $result = (new YourClass())->doSomething('');
    $t->assert('Handles empty input gracefully', $result === null);

    return $t;
}

// Run all tests in this file
$suite = new TestSuite();
$suite->addTest(test_feature_behavior());
$suite->addTest(test_feature_edge_case());
$suite->run();
```

### Database Tests

Use in-memory SQLite for isolated, fast tests:

```php
function test_dbquery_insert(): Test
{
    $t = new Test('DbQuery - Insert');

    $pdo = new BbPdo('sqlite::memory:');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $db = new DbQuery($pdo);

    // Create test table
    $pdo->exec("CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT
    )");

    // Test insert
    $id = $db->table('users')->insert([
        'username' => 'alice',
        'email' => 'alice@test.com'
    ]);

    $t->assert('Insert returns positive ID', $id > 0);

    // Verify data
    $user = $db->table('users')->where('id', $id)->first();
    $t->assertEquals('Username matches', 'alice', $user['username'] ?? '');

    return $t;
}
```

### Router / E2E Flow Tests

Test complete workflows by setting `$_SERVER` state and dispatching through the `Bulletin\Router`:

```php
function test_e2e_thread_lifecycle(): Test
{
    $t = new Test('E2E: Thread lifecycle');

    // Simulate request
    $_SERVER = [
        'REQUEST_URI' => '/thread/123',
        'REQUEST_METHOD' => 'GET',
        'HTTP_HOST' => 'localhost',
        'SCRIPT_NAME' => '/index.php',
    ];
    $_GET = [];

    $router = new Bulletin\Router();
    $router->get('/thread/{id:\d+}', function($params) {
        return ['status' => 200, 'body' => 'thread:' . $params['id']];
    });

    ob_start();
    $router->dispatch();
    $output = ob_get_clean();

    $t->assertEquals('Route matches thread pattern', 'thread:123', $output);

    return $t;
}
```

### JSON API Tests

Test automatic JSON encoding for API routes:

```php
function test_json_api_flow(): Test
{
    $t = new Test('E2E: JSON API');

    $_SERVER = [
        'REQUEST_URI' => '/api/threads',
        'REQUEST_METHOD' => 'GET',
        'HTTP_ACCEPT' => 'application/json',
        'HTTP_HOST' => 'localhost',
        'SCRIPT_NAME' => '/index.php',
    ];

    $router = new Bulletin\Router();
    $router->api()->get('/api/threads', function($params) {
        return ['threads' => [], 'total' => 0];
    });

    ob_start();
    $router->dispatch();
    $output = ob_get_clean();

    $decoded = json_decode($output, true);
    $t->assert('Returns valid JSON', $decoded !== null);

    return $t;
}
```

### Plugin Manager Tests

Test hook system behavior:

```php
function test_hook_filter(): Test
{
    $t = new Test('PluginManager - Filter');

    $pm = new PluginManager('/tmp', '/tmp/manifest.json');

    // Register filter chain
    $pm->addHook('content_filter', function($value) {
        return $value . 'A';
    });
    $pm->addHook('content_filter', function($value) {
        return $value . 'B';
    });

    $result = $pm->filter('content_filter', 'start-');
    $t->assertEquals('Filter chains callbacks', 'start-AB', $result);

    return $t;
}
```

### Auth Tests

Test password hashing, CSRF, permissions:

```php
function test_password_hashing(): Test
{
    $t = new Test('Auth - Password Hashing');

    $hash = password_hash('secret', PASSWORD_DEFAULT);
    $t->assertTrue('Verify correct password', password_verify('secret', $hash));
    $t->assertFalse('Reject wrong password', password_verify('wrong', $hash));

    return $t;
}

function test_permissions(): Test
{
    $t = new Test('Auth - Permissions');

    // Setup in-memory DB with roles
    $pdo = new PDO('sqlite::memory:');
    $pdo->exec("CREATE TABLE roles (id INTEGER PRIMARY KEY, name TEXT, permissions TEXT)");
    $pdo->exec("INSERT INTO roles VALUES (1, 'admin', '[\"can_ban\"]')");
    $GLOBALS['pdo'] = $pdo;

    $_SESSION['user_role'] = 'admin';
    $t->assertTrue('Admin has permission', user_has_permission('can_ban'));

    return $t;
}
```

## Test Coverage

| File | Component | Tests | What's Tested |
|---|---|---|---|
| `DbQueryTest.php` | Query builder | 40 | Insert, select, where, update, delete, order, limit, offset, count, exists, paginate, insertIgnore, pluck, raw queries |
| `E2eFlowTest.php` | End-to-end flows | 21 | Thread lifecycle, JSON API responses, plugin routes, plugin migrations, current_route_action() helper |
| `PluginManagerTest.php` | Hook system | 17 | Actions, filters, checks, priority, removal |
| `AuthTest.php` | Authentication | 35 | Password hashing, CSRF, permissions, session state, ban/suspension, input validation |
| `MigratorTest.php` | Migration engine | 27 | Table creation, up/down, batch tracking, pending detection, class loading |
| `SecurityTest.php` | Security | 25 | CSRF rotation, Request sanitization, audit log |
| `PluginRouterTest.php` | Plugin routing | 4 | Plugin route/middleware registration, `$_GET` population |
| **Total** | | **175** | |

## Exit Codes

- `0` — All tests passed
- `1` — One or more tests failed (or no test files found)

This makes the suite usable in CI/CD pipelines:

```bash
php tests/run.php && echo "OK" || echo "FAILED"
```

## Adding New Tests

1. Create `tests/YourFeatureTest.php`
2. Require the class under test
3. Define test functions returning `Test` objects
4. Add them to a `TestSuite` at the bottom
5. Run with `php tests/run.php YourFeature`

No configuration, no bootstrap, no dependencies.
