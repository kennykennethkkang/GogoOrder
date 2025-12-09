<?php
// PHP/db.php
// Centralized SQLite connection + schema + seed helpers.

declare(strict_types=1);

// Start a session for auth/csrf-less demo use.
if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

function gogo_db(): PDO
{
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $dbPath = __DIR__ . '/../data/gogo.sqlite';
    $dir = dirname($dbPath);
    if (!is_dir($dir)) {
        mkdir($dir, 0777, true);
    }

    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('PRAGMA foreign_keys = ON;');

    gogo_bootstrap_schema($pdo);
    gogo_seed_if_empty($pdo);
    gogo_backfill_credentials($pdo);

    return $pdo;
}

function gogo_bootstrap_schema(PDO $pdo): void
{
    // Helper to add missing columns without migrations.
    $ensureColumn = static function (string $table, string $column, string $definition) use ($pdo): void {
        $exists = false;
        $cols = $pdo->query("PRAGMA table_info({$table})")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($cols as $col) {
            if (strcasecmp($col['name'], $column) === 0) {
                $exists = true;
                break;
            }
        }
        if (!$exists) {
            $pdo->exec("ALTER TABLE {$table} ADD COLUMN {$column} {$definition}");
        }
    };

    $pdo->exec(<<<SQL
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT,
            last_name TEXT,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('customer', 'admin')),
            security_question TEXT,
            security_answer_hash TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
    SQL);
    $ensureColumn('users', 'security_question', 'TEXT');
    $ensureColumn('users', 'security_answer_hash', 'TEXT');

    $pdo->exec(<<<SQL
        CREATE TABLE IF NOT EXISTS auth_credentials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('customer', 'admin')),
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    SQL);

    $pdo->exec(<<<SQL
        CREATE TABLE IF NOT EXISTS menu_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            category TEXT,
            description TEXT,
            image_url TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
    SQL);

    $pdo->exec(<<<SQL
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            customer_name TEXT,
            address TEXT,
            total REAL NOT NULL,
            status TEXT DEFAULT 'Pending',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );
    SQL);
    $ensureColumn('orders', 'order_type', "TEXT DEFAULT 'pickup'");
    $ensureColumn('orders', 'scheduled_time', 'TEXT');
    $ensureColumn('orders', 'address', 'TEXT');

    $pdo->exec(<<<SQL
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            menu_item_id INTEGER,
            item_name TEXT NOT NULL,
            qty INTEGER NOT NULL,
            price REAL NOT NULL,
            description TEXT,
            customizations TEXT,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL
        );
    SQL);
    $ensureColumn('order_items', 'description', 'TEXT');
    $ensureColumn('order_items', 'customizations', 'TEXT');

    $pdo->exec(<<<SQL
        CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT NOT NULL UNIQUE,
            expires_at TEXT NOT NULL,
            used INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    SQL);
}

function gogo_store_credentials(PDO $pdo, int $userId, string $username, string $passwordHash, string $role): void
{
    if ($userId <= 0 || $username === '' || $passwordHash === '') {
        return;
    }

    $stmt = $pdo->prepare('
        INSERT INTO auth_credentials (user_id, role, username, password_hash)
        VALUES (:uid, :role, :username, :hash)
        ON CONFLICT(username) DO UPDATE SET
            user_id = excluded.user_id,
            role = excluded.role,
            password_hash = excluded.password_hash
    ');

    $stmt->execute([
        ':uid' => $userId,
        ':role' => $role,
        ':username' => strtolower($username),
        ':hash' => $passwordHash,
    ]);
}

function gogo_backfill_credentials(PDO $pdo): void
{
    $users = $pdo->query('SELECT id, email, password_hash, role FROM users')->fetchAll(PDO::FETCH_ASSOC);
    foreach ($users as $user) {
        if (empty($user['email']) || empty($user['password_hash'])) {
            continue;
        }
        gogo_store_credentials(
            $pdo,
            (int) $user['id'],
            $user['email'],
            $user['password_hash'],
            $user['role'] ?? 'customer'
        );
    }
}

function gogo_seed_if_empty(PDO $pdo): void
{
    // Seed a default admin + a demo customer.
    $userCount = (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
    if ($userCount === 0) {
        $stmt = $pdo->prepare('
            INSERT INTO users (first_name, last_name, email, phone, password_hash, role)
            VALUES (:first, :last, :email, :phone, :pass, :role)
        ');

        $hashAdmin = password_hash('admin123', PASSWORD_DEFAULT);
        $stmt->execute([
            ':first' => 'Admin',
            ':last' => 'User',
            ':email' => 'admin@gogoorder.local',
            ':phone' => '555-0100',
            ':pass' => $hashAdmin,
            ':role' => 'admin',
        ]);
        $adminId = (int) $pdo->lastInsertId();
        gogo_store_credentials($pdo, $adminId, 'admin@gogoorder.local', $hashAdmin, 'admin');

        $hashCustomer = password_hash('customer123', PASSWORD_DEFAULT);
        $stmt->execute([
            ':first' => 'Demo',
            ':last' => 'Customer',
            ':email' => 'customer@gogoorder.local',
            ':phone' => '555-0200',
            ':pass' => $hashCustomer,
            ':role' => 'customer',
        ]);
        $custId = (int) $pdo->lastInsertId();
        gogo_store_credentials($pdo, $custId, 'customer@gogoorder.local', $hashCustomer, 'customer');
    }

    // Seed menu items if empty using existing JSON/menu.json as source.
    $menuCount = (int) $pdo->query('SELECT COUNT(*) FROM menu_items')->fetchColumn();
    if ($menuCount === 0) {
        $jsonPath = __DIR__ . '/../JSON/menu.json';
        if (is_readable($jsonPath)) {
            $menu = json_decode((string) file_get_contents($jsonPath), true);
            if (is_array($menu)) {
                $stmt = $pdo->prepare('
                    INSERT INTO menu_items (name, price, category, description, image_url)
                    VALUES (:name, :price, :category, :description, :image)
                ');

                foreach ($menu as $item) {
                    $stmt->execute([
                        ':name' => $item['name'] ?? 'Item',
                        ':price' => $item['price'] ?? 0,
                        ':category' => $item['category'] ?? '',
                        ':description' => $item['description'] ?? '',
                        ':image' => $item['image'] ?? '',
                    ]);
                }
            }
        }
    }
}

function gogo_current_user(): ?array
{
    if (!isset($_SESSION['user_id'])) {
        return null;
    }

    static $cached = null;
    if ($cached !== null) {
        return $cached;
    }

    $pdo = gogo_db();
    $stmt = $pdo->prepare('SELECT id, first_name, last_name, email, phone, role, created_at FROM users WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    $cached = $user ?: null;
    return $cached;
}

function gogo_require_login(?string $role = null): array
{
    $user = gogo_current_user();
    if (!$user) {
        header('Location: ' . gogo_login_path($role));
        exit;
    }

    if ($role !== null && $user['role'] !== $role) {
        header('Location: ' . gogo_login_path($role));
        exit;
    }

    return $user;
}

function gogo_login_path(?string $role = null): string
{
    $target = '/HTML/login.php';
    if ($role === 'admin') {
        $target = '/HTML/admin-auth.php';
    }
    return $target;
}

function gogo_logout(): void
{
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
}
