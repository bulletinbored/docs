---
title: Rendering
description: Bulletin\Renderer — micro template engine for clean view rendering.
---
# Rendering

`src/Renderer.php` provides a micro template engine that separates logic from presentation. Templates receive pre-computed data and use helper methods for escaping, partials, and components.

## Basic Usage

```php
$r = new Bulletin\Renderer(__DIR__ . '/views');
$r->display('thread-clean', ['thread' => $thread, 'posts' => $posts]);
```

## Template Helpers

### Escaped Output

Always use `$this->e()` to output user content:

```php
// In a template:
<h1><?= $this->e($thread['title']) ?></h1>
<p>By <?= $this->e($username) ?></p>
```

### Raw Output (Trusted HTML)

For already-sanitized HTML (like rendered Markdown):

```php
<div class="post-body"><?= $this->raw($renderedContent) ?></div>
```

### Partials

Include reusable template fragments:

```php
<?= $this->renderPartial('sidebar', ['categories' => $categories]) ?>
```

### Components

Render a component with data:

```php
<?= $this->renderComponent('post', [
    'post' => $post,
    'number' => 1,
    'isOp' => true,
    'thread' => $thread,
]) ?>
```

### Slots and Layouts

Define layout sections:

```php
<?php $this->slot('sidebar') ?>
    <!-- sidebar content -->
<?php $this->endSlot() ?>

<!-- Later: -->
<?php $this->renderSlot('sidebar') ?>

<!-- Or with fallback: -->
<?php $this->yield('sidebar', 'Default content') ?>
```

### Control Flow

```php
<?= $this->when($isAdmin, fn() => $this->renderComponent('admin_panel')) ?>

<?= $this->each($posts, fn($post, $i) => $this->renderComponent('post', ['post' => $post, 'number' => $i + 1])) ?>
```

### CSRF Field

```php
<form method="POST">
    <?= $this->csrfField() ?>
    <!-- other fields -->
</form>
```

### URL and Translation Helpers

```php
<a href="<?= $this->url('thread', ['id' => $thread['id']]) ?>">View</a>
<button><?= $this->t('submit') ?></button>
```

## Component Structure

Components live in `views/components/`:

```
views/
├── components/
│   ├── post.php           # Single post display
│   └── thread_modals.php  # Moderation dialogs
├── thread-clean.php       # Clean thread template using components
└── header.php             # Legacy header (shared)
```

### Example Component (`views/components/post.php`)

```php
<?php
/**
 * @var Bulletin\Renderer $this
 * @var array $post
 * @var int $number
 * @var bool $isOp
 * @var array $thread
 */
?>
<article class="post <?= $isOp ? 'post-op' : '' ?>">
    <div class="post-author"><?= $this->e($post['author']) ?></div>
    <div class="post-body"><?= marked_parse($post['content']) ?></div>
</article>
```

## Clean Template Example

```php
<?php
/** @var Bulletin\Renderer $this */
/** @var array $thread */
/** @var array $posts */
?>
<?php include __DIR__.'/header.php'; ?>
<?php render_header($thread['title']); ?>

<h1><?= $this->e($thread['title']) ?></h1>

<?php foreach ($posts as $i => $post): ?>
    <?= $this->renderComponent('post', [
        'post' => $post,
        'number' => $i + 2,
        'isOp' => false,
        'thread' => $thread,
    ]) ?>
<?php endforeach; ?>

<?php render_footer(); ?>
```

## Best Practices

1. **No logic in templates** — all data is pre-computed in action handlers
2. **Always escape** — use `$this->e()` for any user-generated content
3. **Use components** — extract reusable UI into `views/components/`
4. **Keep templates declarative** — if/else for visibility, foreach for loops, no business logic
