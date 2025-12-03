<?php
// PHP/auth.php
// Lightweight auth helpers for login/signup/logout.

declare(strict_types=1);

require_once __DIR__ . '/db.php';

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

    $stmt = $pdo->prepare('
        INSERT INTO users (first_name, last_name, email, phone, password_hash, role)
        VALUES (:first, :last, :email, :phone, :pass, :role)
    ');

    $stmt->execute([
        ':first' => $first,
        ':last' => $last,
        ':email' => $email,
        ':phone' => $phone,
        ':pass' => password_hash($password, PASSWORD_DEFAULT),
        ':role' => $role,
    ]);

    $id = (int) $pdo->lastInsertId();
    $_SESSION['user_id'] = $id;

    return ['ok' => true, 'user' => gogo_current_user()];
}

function gogo_login_user(string $email, string $password, ?string $expectedRole = null): array
{
    $pdo = gogo_db();
    $email = strtolower(trim($email));

    $stmt = $pdo->prepare('SELECT * FROM users WHERE email = :email LIMIT 1');
    $stmt->execute([':email' => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user || !password_verify($password, $user['password_hash'])) {
        return ['ok' => false, 'message' => 'Invalid email or password.'];
    }

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

