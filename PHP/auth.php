<?php
// PHP/auth.php
// Lightweight auth helpers for login/signup/logout.

declare(strict_types=1);

require_once __DIR__ . '/db.php';

function gogo_sync_user_json(array $user): void
{
    $roleFile = $user['role'] === 'admin' ? __DIR__ . '/../JSON/admins.json' : __DIR__ . '/../JSON/costumers.json';
    $data = [];
    if (is_readable($roleFile)) {
        $decoded = json_decode((string) file_get_contents($roleFile), true);
        if (is_array($decoded)) {
            $data = $decoded;
        }
    }

    $maxId = 0;
    foreach ($data as &$row) {
        if (isset($row['id']) && (int) $row['id'] > 0) {
            $maxId = max($maxId, (int) $row['id']);
        }
    }
    unset($row);

    $found = false;
    foreach ($data as &$row) {
        if (isset($row['email']) && strtolower($row['email']) === strtolower($user['email'])) {
            $row['id'] = $user['id'];
            $row['first_name'] = $user['first_name'] ?? '';
            $row['last_name'] = $user['last_name'] ?? '';
            $row['phone'] = $user['phone'] ?? '';
            $found = true;
            break;
        }
    }
    unset($row);

    if (!$found) {
        $data[] = [
            'id' => $user['id'] ?? ($maxId + 1),
            'first_name' => $user['first_name'] ?? '',
            'last_name' => $user['last_name'] ?? '',
            'email' => $user['email'] ?? '',
            'phone' => $user['phone'] ?? '',
        ];
    }

    // Backfill ids
    $maxId = 0;
    foreach ($data as &$row) {
        if (isset($row['id']) && (int) $row['id'] > 0) {
            $maxId = max($maxId, (int) $row['id']);
        }
    }
    unset($row);
    foreach ($data as &$row) {
        if (!isset($row['id']) || (int) $row['id'] === 0) {
            $maxId++;
            $row['id'] = $maxId;
        }
    }
    unset($row);

    file_put_contents($roleFile, json_encode($data, JSON_PRETTY_PRINT));
}

function gogo_register_user(array $data, string $role = 'customer'): array
{
    $pdo = gogo_db();
    $email = strtolower(trim($data['email'] ?? ''));
    $password = $data['password'] ?? '';
    $first = trim($data['first_name'] ?? '');
    $last = trim($data['last_name'] ?? '');
    $phone = trim($data['phone'] ?? '');

    if ($email === '' || $password === '') {
        return ['ok' => false, 'message' => 'Email and password are required.'];
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        return ['ok' => false, 'message' => 'Email is not valid.'];
    }

    if (strlen($password) < 6) {
        return ['ok' => false, 'message' => 'Password must be at least 6 characters.'];
    }

    $role = $role === 'admin' ? 'admin' : 'customer';

    $check = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
    $check->execute([':email' => $email]);
    if ($check->fetch(PDO::FETCH_ASSOC)) {
        return ['ok' => false, 'message' => 'Account already exists for this email.'];
    }

    $hash = password_hash($password, PASSWORD_DEFAULT);

    $stmt = $pdo->prepare('
        INSERT INTO users (first_name, last_name, email, phone, password_hash, role)
        VALUES (:first, :last, :email, :phone, :pass, :role)
    ');

    $stmt->execute([
        ':first' => $first,
        ':last' => $last,
        ':email' => $email,
        ':phone' => $phone,
        ':pass' => $hash,
        ':role' => $role,
    ]);

    $id = (int) $pdo->lastInsertId();
    gogo_store_credentials($pdo, $id, $email, $hash, $role);
    $_SESSION['user_id'] = $id;

    $userData = gogo_current_user();
    if ($userData) {
        gogo_sync_user_json($userData);
    }

    return ['ok' => true, 'user' => $userData];
}

function gogo_login_user(string $email, string $password, ?string $expectedRole = null): array
{
    $pdo = gogo_db();
    $email = strtolower(trim($email));

    $stmt = $pdo->prepare('
        SELECT u.*, c.password_hash
        FROM auth_credentials c
        JOIN users u ON u.id = c.user_id
        WHERE lower(c.username) = :email
        LIMIT 1
    ');
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        // Fallback for legacy rows without credentials entry.
        $fallback = $pdo->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
        $fallback->execute([':email' => $email]);
        $user = $fallback->fetch(PDO::FETCH_ASSOC);
    }

    if (!$user || !password_verify($password, $user['password_hash'])) {
        return ['ok' => false, 'message' => 'Invalid email or password.'];
    }

    // Backfill credentials row for any legacy account.
    gogo_store_credentials($pdo, (int) $user['id'], $email, $user['password_hash'], $user['role'] ?? 'customer');

    if ($expectedRole !== null && $user['role'] !== $expectedRole) {
        return ['ok' => false, 'message' => 'You do not have access to this area.'];
    }

    $_SESSION['user_id'] = (int) $user['id'];

    return ['ok' => true, 'user' => gogo_current_user()];
}

function gogo_assert_admin(): array
{
    return gogo_require_login('admin');
}
