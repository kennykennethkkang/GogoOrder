<?php
// PHP/seed.php
// One-time seeder to populate SQLite from JSON fixtures.

declare(strict_types=1);

require_once __DIR__ . '/db.php';

$pdo = gogo_db();

function seed_users(PDO $pdo, string $jsonPath, string $role): void
{
    // read json from disk, skip if it doesn't exist
    if (!is_readable($jsonPath)) {
        return;
    }
    $data = json_decode((string) file_get_contents($jsonPath), true);
    if (!is_array($data)) {
        return;
    }

    // prepare insert into users table; ignore duplicates by id/email
    $ins = $pdo->prepare('
        INSERT OR IGNORE INTO users (id, first_name, last_name, email, phone, password_hash, role)
        VALUES (:id, :first, :last, :email, :phone, :pass, :role)
    ');

    foreach ($data as $row) {
        // pull fields and give a default password if none is in the json
        $id = isset($row['id']) ? (int) $row['id'] : null;
        $email = $row['email'] ?? null;
        if (!$email) continue;

        $pass = $row['password'] ?? 'password123';
        $hash = password_hash($pass, PASSWORD_DEFAULT);

        $ins->execute([
            ':id' => $id,
            ':first' => $row['first_name'] ?? '',
            ':last' => $row['last_name'] ?? '',
            ':email' => $email,
            ':phone' => $row['phone'] ?? '',
            ':pass' => $hash,
            ':role' => $role,
        ]);

        // Ensure credentials table mirrors the user record.
        // this looks up the id we just inserted and saves to auth_credentials too
        $idStmt = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
        $idStmt->execute([':email' => $email]);
        $dbId = (int) $idStmt->fetchColumn();
        if ($dbId > 0) {
            gogo_store_credentials($pdo, $dbId, $email, $hash, $role);
        }
    }
}

function seed_menu(PDO $pdo, string $jsonPath): void
{
    // load menu json and insert rows if they aren't already there
    if (!is_readable($jsonPath)) return;
    $data = json_decode((string) file_get_contents($jsonPath), true);
    if (!is_array($data)) return;

    $ins = $pdo->prepare('
        INSERT OR IGNORE INTO menu_items (id, name, price, category, description, image_url)
        VALUES (:id, :name, :price, :category, :description, :image)
    ');

    foreach ($data as $row) {
        $ins->execute([
            ':id' => $row['id'] ?? null,
            ':name' => $row['name'] ?? 'Item',
            ':price' => $row['price'] ?? 0,
            ':category' => $row['category'] ?? '',
            ':description' => $row['description'] ?? '',
            ':image' => $row['image'] ?? '',
        ]);
    }
}

// Seed admins and customers
// run both files so both roles are populated
seed_users($pdo, __DIR__ . '/../JSON/admins.json', 'admin');
seed_users($pdo, __DIR__ . '/../JSON/costumers.json', 'customer');

// Seed menu
seed_menu($pdo, __DIR__ . '/../JSON/menu.json');

echo "Seed completed.\n";
