---
title: Installation
description: From zero to working forum in under a minute.
---
# Installation

From zero to working forum in under a minute.

## Requirements

- A web server running **PHP 8.x**
- The **PDO** extension with either **SQLite** or **MySQL** driver
- Apache `mod_rewrite` enabled (for SEO-friendly URLs)

## Step 1: Upload the Files

Upload all files to a web server running PHP 8.x with the PDO extension (SQLite or MySQL).

## Step 2: Enable mod_rewrite

Make sure Apache `mod_rewrite` is enabled for SEO-friendly URLs.

## Step 3: Set Write Permissions

The `data/`, `uploads/`, and `uploads/avatars/` directories must be writable by the web server.

## Step 4: Run the Installer

Visit the site in your browser. If `config.php` is missing, the 2-step installer starts automatically:

- **Step 1**: Choose your database (SQLite or MySQL) and test the connection
- **Step 2**: Set your site name, administrator account, and email

The installer creates `config.php` and the database automatically.

## Step 5: Log In

Log in with the administrator credentials you just created.

## Manual Installation

If you prefer to configure `config.php` yourself instead of using the web installer, see [Manual Installation](installation-manual).