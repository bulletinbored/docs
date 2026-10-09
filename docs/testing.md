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
php tests/run.php Registration
php tests/run.php Installer
php tests/run.php SecurityHardening
php tests/run.php ContentCrud
php tests/run.php E2eIntegration
php tests/run.php DatabaseIntegrity
php tests/run.php Suggested
php tests/run.php UpdateManager
php tests/run.php PluginTheme
php tests/run.php Upgrade
php tests/run.php UpdateFailureMode
php tests/run.php EmailSecurity
php tests/run.php EndpointAuthorization
php tests/run.php SessionSecurity
php tests/run.php UploadSecurity

# Verbose output
php tests/run.php --verbose

# List all registered tests
php tests/run.php --list

# Source coverage report (line coverage with Xdebug/PCOV, otherwise loaded files)
php tests/run.php --coverage

# Enable the HTTP integration tests explicitly (auto-enabled on non-Windows)
BB_HTTP_TESTS=1 php tests/run.php BootstrapIntegration
```

## Test Structure

```
tests/
├── harness.php                 # Test + TestSuite classes (the engine)
├── bootstrap.php               # Test environment bootstrap (temp dirs, in-memory DB, test mode)
├── run.php                     # CLI runner (--verbose, --list, --coverage)
├── BootstrapIntegrationTest.php # Real-bootstrap smoke test + optional HTTP header/route checks
├── DbQueryTest.php             # Query builder tests
├── E2eFlowTest.php             # End-to-end flow tests
├── PluginManagerTest.php       # Hook system tests
├── AuthTest.php                # Auth, permissions, CSRF, AuthZ tests
├── MigratorTest.php            # Migration engine tests
├── SecurityTest.php            # CSRF rotation, Request, audit log, trusted proxies
├── ResponseTest.php             # Response object + typed Request tests
├── MarkdownTest.php             # Markdown security tests
├── PluginRouterTest.php         # Plugin route/middleware registration
├── UpgradeTest.php              # Upgrade pipeline tests
├── AuthHardeningTest.php        # Auth hardening tests
├── ContentHardeningTest.php     # Content hardening tests
├── RendererTest.php             # Template engine tests
├── ModerationTest.php           # Moderation actions tests
├── ModerationHandlerTest.php    # Moderation handler integration tests
├── DatabaseMatrixTest.php       # Cross-database compatibility tests
├── SecurityFixesTest.php        # Security fixes tests
├── HelpersTest.php              # Helper module tests
├── RegistrationTest.php         # Registration & login tests
├── InstallerTest.php            # Installation process tests
├── SecurityHardeningTest.php    # SQL injection, upload security, security headers
├── ContentCrudTest.php          # Thread creation, replies, viewing, pagination
├── E2eIntegrationTest.php       # End-to-end flow tests (user journeys)
├── DatabaseIntegrityTest.php    # Foreign keys, constraints, counters, soft-delete
├── SuggestedTest.php            # Edge case tests
├── UpdateManagerTest.php        # Update system, ZIP validation, rollback
├── PluginThemeTest.php          # Plugin and theme tests
├── EndpointAuthorizationTest.php # HTTP endpoint authorization matrix
├── EmailSecurityTest.php        # SMTP injection and email validation
├── SessionSecurityTest.php     # Session invalidation tests
├── UploadSecurityTest.php      # Upload security tests
├── TelemetryTest.php           # Anonymous install heartbeat (guards, payload, opt-out)
└── VersionConsistencyTest.php  # VERSION / config-sample / release-notes consistency
```

## How Tests Are Registered

Most test files define functions named `test_*()` that return a `Test` object, then register them at the bottom:

```php
register_tests('test_foo', 'test_bar', 'test_baz');
```

The runner (`tests/run.php`) loads all `*Test.php` files, collects the registered tests, and executes them. Test files should not call `run()` or `exit()` — the runner handles that.

### Special case: DatabaseMatrixTest.php

`DatabaseMatrixTest.php` does not use `register_tests()`. Instead it calls `register_database_matrix_tests()` at the bottom, which adds tests directly to the suite via `$suite->addTest()`. This is because the same test functions are executed multiple times, once per database driver (SQLite, optionally MySQL/MariaDB).

### Helper functions

Some test files define helper functions that are not registered as tests. These are named without the `test_` prefix to avoid confusion:

- `setup_schema_endpoint()`, `create_user_endpoint()`, `create_post_endpoint()` in `EndpointAuthorizationTest.php`
- `setup_schema_upload()`, `create_user_upload()`, `create_category_upload()`, `create_thread_upload()`, `create_upload_sec()`, `can_access_upload()` in `UploadSecurityTest.php`
- `setup_schema_session()`, `create_user_session()` in `SessionSecurityTest.php`

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

// Exception assertions
$t->assertThrows('description', function() { throw new Exception('test'); });
$t->assertNotThrows('description', function() { /* no exception */ });

// Custom predicate
$t->assertThat('description', function($v) { return $v > 0; }, $value);

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

Each test file defines functions that return a `Test` object and registers them with `register_tests()`:

```php
<?php
/**
 * Feature tests — tests for a specific component.
 */

require_once __DIR__ . '/harness.php';
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

// Register tests for the runner
register_tests('test_feature_behavior', 'test_feature_edge_case');
```

The runner (`tests/run.php`) loads all test files and executes registered tests together. No `exit()` call needed — the runner handles exit codes.

### Database Tests

Use in-memory SQLite for isolated, fast tests:

```php
function test_dbquery_insert(): Test
{
    $t = new Test('DbQuery - Insert');

    $pdo = new PDO('sqlite::memory:');
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

    // Setup in-memory DB with roles (resource.action notation)
    $pdo = new PDO('sqlite::memory:');
    $pdo->exec("CREATE TABLE roles (id INTEGER PRIMARY KEY, name TEXT, permissions TEXT)");
    $pdo->exec("INSERT INTO roles VALUES (1, 'admin', '[\"admin.access\",\"users.ban\"]')");
    $pdo->exec("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, role TEXT)");
    $pdo->exec("INSERT INTO users (id, username, role) VALUES (1, 'admin', 'admin')");

    // AuthZ is the single source of truth (no globals, no user_has_permission())
    $authz = new AuthZ($pdo);
    $t->assertTrue('Admin has permission', $authz->can(1, 'users.ban'));

    return $t;
}
```

### Functional Handler Tests

Test handlers directly by setting up the database state and calling the handler function. This tests the actual authorization logic, not just static code analysis:

```php
function test_download_hidden_thread_guest_forbidden(): Test
{
    $t = new Test('Download: guest cannot download from hidden thread');
    $pdo = setupDB();  // Creates in-memory SQLite with schema
    $authz = new AuthZ($pdo);
    App::reset();
    App::getInstance()->authz = $authz;
    App::getInstance()->pdo = $pdo;
    $_SESSION = [];  // Guest user

    // Create hidden thread and associated upload
    $stmt = $pdo->prepare("INSERT INTO threads (id, category_id, user_id, title, status) VALUES (1, 1, 1, 'Hidden', 'hidden')");
    $stmt->execute();
    $stmt = $pdo->prepare("INSERT INTO uploads (id, thread_id, user_id, filename, original_name, size, mime_type) VALUES (100, 1, 1, 'file.txt', 'file.txt', 100, 'text/plain')");
    $stmt->execute();

    $threw = false;
    try {
        handle_download(['id' => 100]);
    } catch (\Bulletin\ForbiddenException $e) {
        $threw = true;
    }
    $t->assertTrue('Guest blocked from hidden thread download', $threw);

    App::reset();
    return $t;
}
```

**Note:** For "allowed" cases, the handler calls `exit` after serving the file. To avoid this, either:
- Don't create the physical file (handler throws `NotFoundException` after passing access control — this verifies the access check passed)
- Clean up any residual files with `@unlink()` before the test

## Test Count

The suite contains test cases across the following files. The exact count depends on whether `DatabaseMatrixTest.php` runs once (SQLite only) or twice (SQLite + MySQL/MariaDB).

| File | Registered Tests | Notes |
|---|---|---|
| `DbQueryTest.php` | 9 | Query builder |
| `E2eFlowTest.php` | 5 | End-to-end flows |
| `PluginManagerTest.php` | 14 | Hook system, lifecycle & rollback |
| `AuthTest.php` | 6 | Auth, permissions, CSRF |
| `MigratorTest.php` | 7 | Migration engine |
| `SecurityTest.php` | 7 | CSRF rotation, Request, audit log |
| `ResponseTest.php` | 9 | Response object + Request |
| `UpgradeTest.php` | 4 | Upgrade pipeline |
| `AuthHardeningTest.php` | 7 | Auth hardening |
| `ContentHardeningTest.php` | 9 | Content hardening |
| `RendererTest.php` | 4 | Template engine |
| `ModerationTest.php` | 11 | Moderation actions |
| `ModerationHandlerTest.php` | 6 | Moderation handler integration |
| `DatabaseMatrixTest.php` | 9 | Cross-database (SQLite) |
| `PluginRouterTest.php` | 4 | Plugin routing |
| `RegistrationTest.php` | 15 | Registration & login |
| `InstallerTest.php` | 11 | Installer |
| `SecurityHardeningTest.php` | 14 | Security hardening |
| `ContentCrudTest.php` | 14 | Content CRUD |
| `E2eIntegrationTest.php` | 7 | E2E flows |
| `DatabaseIntegrityTest.php` | 11 | Database integrity |
| `SuggestedTest.php` | 10 | Edge cases |
| `UpdateManagerTest.php` | 16 | Updater |
| `UpdateFailureModeTest.php` | 15 | Update failure modes |
| `SecurityFixesTest.php` | 26 | Security fixes |
| `PluginThemeTest.php` | 22 | Plugins & themes |
| `EmailSecurityTest.php` | 14 | Email security |
| `EndpointAuthorizationTest.php` | 14 | Endpoint authorization |
| `SessionSecurityTest.php` | 12 | Session security |
| `UploadSecurityTest.php` | 14 | Upload security |
| `TelemetryTest.php` | 6 | Anonymous install heartbeat |
| `VersionConsistencyTest.php` | 1 | Version consistency |
| **Total (core, SQLite)** | | **358 test functions** |

The counts above reflect the number of registered **core** test functions
(test suites shipped inside plugins under `plugins/*/tests/` add more, e.g.
`plugins/editbored` contributes 47). Each test runs multiple assertions: the
current suite reports **1305 assertions, 0 failures** with `php tests/run.php`
on a PHP build with all required extensions. The exact count depends on whether
`DatabaseMatrixTest.php` runs once (SQLite only) or again per service database.
Run `php tests/run.php --list` to enumerate the registered tests for your
checkout.

## Integration tests

`BootstrapIntegrationTest.php` covers the parts of `src/bootstrap.php` that the
CLI suite skips because of the `BULLETIN_TEST_MODE` early return:

- a subprocess smoke test boots the real bootstrap (session, UTC timezone,
  autoloader, i18n) — always runs;
- optional HTTP tests start the PHP built-in server with `router.php` and assert
  the real security headers and that sensitive files return `403`. They run
  automatically on non-Windows platforms or when `BB_HTTP_TESTS=1` is set (CI
  sets it explicitly).

## Coverage

`php tests/run.php --coverage` prints line coverage using **Xdebug** (executable
lines) or **PCOV** (executed lines) when available, and otherwise a
dependency-free report of which `src/` files the suite loaded. The CI `coverage`
job installs PCOV and runs this automatically.

## Database Matrix

The `DatabaseMatrixTest.php` tests compatibility across database engines:

| Database | Status | How to Test |
|---|---|---|
| SQLite | ✓ Always tested | `php tests/DatabaseMatrixTest.php` |
| MySQL 8.0 / 8.4 | ✓ When available | `DB_DRIVER=mysql php tests/DatabaseMatrixTest.php` |
| MariaDB 10.6 / 10.11 / 11.4 | ✓ When available | Same as MySQL (driver auto-detects) |

### Running Locally with MySQL

```bash
# Start MySQL
docker run -d --name mysql-test -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=bulletinbored_test -p 3306:3306 mysql:8.0

# Run tests
DB_DRIVER=mysql DB_HOST=127.0.0.1 DB_PORT=3306 DB_NAME=bulletinbored_test DB_USER=root DB_PASS=root php tests/DatabaseMatrixTest.php

# Cleanup
docker stop mysql-test && docker rm mysql-test
```

## Exit Codes

- `0` — All tests passed
- `1` — One or more tests failed (or no test files found)

This makes the suite usable in CI/CD pipelines:

```bash
php tests/run.php && echo "OK" || echo "FAILED"
```

## Adding New Tests

1. Create `tests/YourFeatureTest.php`
2. `require_once __DIR__ . '/harness.php';`
3. Define test functions returning `Test` objects
4. Call `register_tests('test_foo', 'test_bar')` at the bottom
5. Run with `php tests/run.php YourFeature`