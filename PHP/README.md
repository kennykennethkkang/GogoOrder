# PHP Directory Organization

This directory contains all backend PHP code for the GogoOrder application.

## Core Files

### `db.php`
- Database connection and schema management
- SQLite database initialization
- Helper functions: `gogo_db()`, `gogo_current_user()`, `gogo_require_login()`, etc.

### `auth.php`
- Authentication and authorization functions
- User registration, login, logout
- Password reset functionality
- JSON sync utilities: `gogo_sync_user_json()`

## API Endpoints

All API files return JSON responses and handle HTTP methods appropriately.

### `api-auth.php`
- **Endpoints:**
  - `GET` - Get current user
  - `POST` with `action=login` - User login
  - `POST` with `action=signup` - User registration
  - `POST` with `action=logout` - User logout
  - `POST` with `action=request-reset` - Request password reset
  - `POST` with `action=reset-password` - Reset password with token
  - `POST` with `action=verify-token` - Verify reset token

### `api-user.php`
- **Endpoint:** `POST` - Update user profile and password
- Requires authentication
- Automatically syncs to JSON role files

### `api-menu.php`
- **Endpoints:**
  - `GET` - List menu items (with optional search/category filters)
  - `POST` - Create menu item (admin only)
  - `PUT/PATCH` - Update menu item (admin only)
  - `DELETE` - Delete menu item (admin only)

### `api-orders.php`
- **Endpoints:**
  - `GET` - List orders (filtered by user role)
  - `POST` - Create new order
  - `PATCH` - Update order status (admin only)

### `api-admins.php`
- **Endpoints:**
  - `GET` - List admins (admin only)
  - `POST` - Create new admin (admin only)

## Utility Files

### `logout.php`
- Handles user logout and redirects to login page
- Used as a direct link (not an API endpoint)

### `seed.php`
- One-time database seeding script
- Populates database from JSON fixtures
- Run with: `php PHP/seed.php`

## Code Organization Notes

- All API files use consistent error handling and JSON responses
- Authentication is handled via `gogo_require_login()` and `gogo_assert_admin()`
- User data is synced between SQLite and JSON files for compatibility
- Password hashes are stored in both `users` and `auth_credentials` tables

## Removed Files

- `normalize_json_ids.php` - Utility script that was not referenced anywhere in the codebase

