# GogoOrder

Simple food ordering demo with customer + admin flows backed by SQLite and PHP (no external frameworks).

## Prerequisites
- PHP 8+ with SQLite extension (built-in on macOS/Linux; Windows PHP packages include it)

## Setup & Run (local)
1) Install deps (none) and start the PHP dev server from the project root:
   ```bash
   php -S localhost:8000
   ```
2) Open http://localhost:8000/login.html to sign in or sign up (customer flow).  
   - First run will create `data/gogo.sqlite` and seed menu items from `JSON/menu.json`.
   - Default seeded users:
     - Customer: `customer@gogoorder.local` / `customer123`
     - Admin: `admin@gogoorder.local` / `admin123`
3) Admin portal: http://localhost:8000/HTML/admin-auth.php (enforces admin role).  
4) Main app: http://localhost:8000/index.php (requires login); Cart at `/HTML/cart.php`; Orders at `/HTML/view-order.php`.

## Project structure (high level)
- `PHP/` — backend (SQLite connection, auth, menu, orders APIs)
- `HTML/` — page shells (PHP versions are dynamic; `.html` files redirect to them)
- `JS/` — front-end logic (auth wiring, menu/cart, admin dashboards)
- `CSS/` — shared styles for admin/auth/customer pages
- `JSON/menu.json` — seed data for menu items
- `data/gogo.sqlite` — generated at runtime (auto-created if missing)

## Seeding SQLite from JSON
From the project root:
```bash
php PHP/seed.php
```
This loads users (admins/customers) and menu items from the JSON files into `data/gogo.sqlite`.
Note: JSON fixtures are ignored in git (`JSON/*.json`) to avoid merge churn; keep your local copies in sync by re-running the seeder when they change.

### Order metadata
- Orders capture type (pickup/delivery), scheduled time, and delivery address (when delivery). These fields are stored in SQLite and mirrored into `JSON/orders.json` for reference.

### Auth storage
- Passwords are stored hashed (PHP `password_hash`) in both `users.password_hash` and the dedicated `auth_credentials` table, which also tracks role + username.  
- Any new signup/login is automatically synced to that table; the seeder mirrors JSON users into both tables so everyone shares the same baseline database.

## Notes
- Frontend uses AJAX (`fetch`) for auth/menu/orders/admin actions.
- All dynamic pages require a session; unauthenticated users are redirected to login.
- Admin pages are role-protected; use the seeded admin or sign up a new admin via `admin-auth.php`.
- Static entry pages (`*.html`) remain for convenience/links and simply forward to the corresponding PHP page.

## Notes
- All dynamic pages require a session; unauthenticated users are redirected to login.
- Admin pages are role-protected; use the seeded admin or sign up a new admin via `admin-auth.php`.
- Static entry pages (`*.html`) remain for convenience/links and simply forward to the corresponding PHP page.
