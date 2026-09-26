---
title: Installation
description: From zero to working forum in under a minute.
---
# Installation

From zero to working forum in under a minute.

## Requirements

- A web server running **PHP 8.1+**
- The **PDO** extension with either **SQLite** or **MySQL** driver
- The **mbstring** extension — used for UTF-8 string handling (avatars, text helpers)
- The **zip** extension (`ZipArchive`) — required to install or update plugins, themes, and language packs
- A supported web server (see below)

`curl` is optional: when it is missing, package downloads fall back to
`file_get_contents()` (which requires `allow_url_fopen`). All three steps of the
installer and the update system work without `curl` as long as that fallback is
available.

## Supported Web Servers

| Server | Config file | Pretty URLs | Data protection | Notes |
|---|---|---|---|---|
| **Apache** | `.htaccess` (included) | ✅ Automatic | ✅ Automatic | Requires `mod_rewrite` |
| **Nginx** | `nginx.conf` (included) | ✅ Manual setup | ✅ Manual setup | Copy to your site config |
| **IIS** | `web.config` (included) | ✅ Automatic | ✅ Automatic | Requires URL Rewrite Module |
| **LiteSpeed** | `.htaccess` (included) | ✅ Automatic | ✅ Automatic | Apache-compatible |
| **PHP built-in** | `router.php` | ✅ Internal | ✅ via `router.php` | Run `php -S localhost:8080 router.php` |

## Quick Start (Apache)

### Step 1: Upload the Files

Upload all files to a web server running PHP 8.1+ with the PDO extension (SQLite or MySQL).

### Step 2: Enable mod_rewrite

Make sure Apache `mod_rewrite` is enabled for SEO-friendly URLs. The included `.htaccess` file handles all rewrite rules automatically.

### Step 3: Set Write Permissions

The `data/`, `uploads/`, and `uploads/avatars/` directories must be writable by the web server.

### Step 4: Run the Installer

Visit the site in your browser. If `config.json` is missing, the 3-step installer starts automatically:

- **Step 1**: Choose your database (SQLite or MySQL) and test the connection
- **Step 2**: Set your site name, administrator account, and email
- **Step 3**: Optionally install suggested plugins to make the installation more complete. The core ships only the basic forum features; you can install the suggested plugins now or add them later from the admin panel.

The installer creates `config.json` and the database automatically.

### Step 5: Security Reminder

The installer refuses to run once `config.json` exists, but you should still
**delete the installer files** after installation completes:
- `install.php`
- `install2.php`
- `install3.php`
- `api/install.php`

Leaving them in place is a security risk.

The shipped server configs also block direct access to `config.json`,
`config.php`, `bb.php` and `router.php`. If you customise your server
configuration, keep those rules.

### Step 6: Log In

Log in with the administrator credentials you just created.

## Post-installation checklist

Before putting the forum in front of real users:

1. **Delete the installer files** — `install.php`, `install2.php`, `install3.php`, `api/install.php`. Once `config.json` exists they refuse to run, but removing them removes the attack surface entirely.
2. **Turn off error display** — set `display_errors = Off` and `expose_php = Off` in `php.ini` (the `doctor` command and the admin diagnostics page warn when they are on).
3. **Serve over HTTPS** — set `force_https`/`cookie_secure` to `true` and configure the reverse proxy header if applicable (see above).
4. **Make sure sensitive paths are blocked** — `data/`, `uploads/private/`, `config.json`, `bb.php` and `router.php` must all return `403`. The shipped `.htaccess`, `nginx.conf`, `web.config` and `router.php` already do this; if you customise them, keep the rules.
5. **Verify the admin password** — if you installed manually and did not set `admin_pass` in `config.json`, the installer generates a temporary one and writes it to the PHP error log with a `CHANGE THIS IMMEDIATELY` note. Change it from the admin panel as soon as you log in.
6. **Check writability** — `data/`, `uploads/`, `uploads/avatars/` and `uploads/private/` must remain writable by the web server user.
7. **Arrange backups** — at minimum, back up `config.json` and the database (the SQLite file in `data/`, or the MySQL database). `data/` also contains `installed.json`, sessions, logs and update metadata.
8. **Review `plugin_verify_files` / `theme_verify_files`** — keep them enabled (default) and read the [Security Model](security.md) before installing third-party extensions.

## Nginx Setup

### Step 1: Upload the Files

Upload all files to your web server.

### Step 2: Configure Nginx

Copy `nginx.conf` from the project root to your Nginx site configuration:

```bash
sudo cp nginx.conf /etc/nginx/sites-available/bulletinbored
sudo ln -s /etc/nginx/sites-available/bulletinbored /etc/nginx/sites-enabled/
```

Edit the file and adjust:
- `server_name` — your domain name
- `root` — path to the bulletinbored installation
- `fastcgi_pass` — path to your PHP-FPM socket or TCP address

### Step 3: Set Write Permissions

The `data/`, `uploads`, and `uploads/avatars/` directories must be writable by the web server.

### Step 4: Test and Reload Nginx

```bash
sudo nginx -t && sudo systemctl reload nginx
```

### Step 5: Run the Installer

Visit the site in your browser. The installer will start automatically.

**Note:** Nginx does not read `.htaccess` files. The `nginx.conf` file includes all required rewrite rules and security blocks. Without it, pretty URLs and data directory protection will not work.

## IIS Setup (Windows Server)

### Step 1: Upload the Files

Upload all files to your web server.

### Step 2: Install URL Rewrite Module

Download and install the [IIS URL Rewrite Module](https://www.iis.net/downloads/microsoft/url-rewrite) if not already installed.

### Step 3: Set Write Permissions

Ensure the `data/`, `uploads/`, and `uploads/avatars/` directories are writable by the application pool identity.

### Step 4: Run the Installer

The included `web.config` file handles all rewrite rules automatically. Visit the site in your browser to start the installer.

## HTTPS Behind a Reverse Proxy

If you run Nginx or another reverse proxy that terminates SSL in front of PHP-FPM, set this header so bulletinbored detects HTTPS correctly:

```nginx
proxy_set_header X-Forwarded-Proto $scheme;
```

Without it, the `force_https` redirect may loop. You can also disable HTTPS forcing in `config.json`:

```json
{
    "force_https": false
}
```

## Manual Installation

If you prefer to configure `config.json` yourself instead of using the web installer, see [Manual Installation](installation-manual).
