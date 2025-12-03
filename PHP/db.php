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

    return $pdo;
}

function gogo_bootstrap_schema(PDO $pdo): void
{
    $pdo->exec(<<<SQL
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            first_name TEXT,
            last_name TEXT,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('customer', 'admin')),
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
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
            total REAL NOT NULL,
            status TEXT DEFAULT 'Pending',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        );
    SQL);

    $pdo->exec(<<<SQL
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            menu_item_id INTEGER,
            item_name TEXT NOT NULL,
            qty INTEGER NOT NULL,
            price REAL NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
            FOREIGN KEY (menu_item_id) REFERENCES menu_items(id) ON DELETE SET NULL
        );
    SQL);
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

        $stmt->execute([
            ':first' => 'Admin',
            ':last' => 'User',
            ':email' => 'admin@gogoorder.local',
            ':phone' => '555-0100',
            ':pass' => password_hash('admin123', PASSWORD_DEFAULT),
            ':role' => 'admin',
        ]);

        $stmt->execute([
            ':first' => 'Demo',
            ':last' => 'Customer',
            ':email' => 'customer@gogoorder.local',
            ':phone' => '555-0200',
            ':pass' => password_hash('customer123', PASSWORD_DEFAULT),
            ':role' => 'customer',
        ]);
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
