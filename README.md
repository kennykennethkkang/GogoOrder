## Setup & Run (local)
1) Start the PHP dev server from the project root:
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

## Seeding SQLite from JSON
From the project root:
```bash
php PHP/seed.php
```
This loads users (admins/customers) and menu items from the JSON files into `data/gogo.sqlite`.
Note: JSON fixtures are ignored in git (`JSON/*.json`) to avoid merge churn; keep your local copies in sync by re-running the seeder when they change.

### Order metadata
- Orders capture type (pickup/delivery), scheduled time, and delivery address (when delivery). These fields are stored in SQLite and mirrored into `JSON/orders.json` for reference.
