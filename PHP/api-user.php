<?php
// PHP/api-user.php
// Update current user's profile and optionally password. Syncs to JSON role files.

declare(strict_types=1);

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/utils.php';

$user = gogo_require_login();
$input = json_decode((string) file_get_contents('php://input'), true) ?? [];

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(['error' => 'Method not allowed'], 405);
}

// pull incoming fields or fall back to what's already on the user record
$first = trim($input['first_name'] ?? $user['first_name'] ?? '');
$last = trim($input['last_name'] ?? $user['last_name'] ?? '');
$phone = trim($input['phone'] ?? $user['phone'] ?? '');
$password = $input['password'] ?? '';

$pdo = gogo_db();

// basic update statement that we tack password onto if needed
$sql = 'UPDATE users SET first_name = :first, last_name = :last, phone = :phone';
$params = [
    ':first' => $first,
    ':last' => $last,
    ':phone' => $phone,
    ':id' => $user['id'],
];

$newPasswordHash = null;
if ($password !== '') {
    // only hash/save password when user actually sent one
    $newPasswordHash = password_hash($password, PASSWORD_DEFAULT);
    $sql .= ', password_hash = :pass';
    $params[':pass'] = $newPasswordHash;
}

$sql .= ' WHERE id = :id';
$stmt = $pdo->prepare($sql);
$stmt->execute($params);

// Update password in auth_credentials if password was changed
if ($newPasswordHash !== null) {
    // keep the credentials table in sync with the main users table
    gogo_store_credentials($pdo, (int) $user['id'], $user['email'], $newPasswordHash, $user['role']);
}

// Refresh user cache and sync to JSON
$updated = gogo_current_user();
if ($updated) {
    gogo_sync_user_json($updated);
}

json_response(['ok' => true, 'user' => $updated]);
