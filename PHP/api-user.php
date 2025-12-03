<?php
// PHP/api-user.php
// Update current user's profile and optionally password. Syncs to JSON role files.

declare(strict_types=1);

require_once __DIR__ . '/db.php';

$user = gogo_require_login();
$input = json_decode((string) file_get_contents('php://input'), true) ?? [];

function json_out(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(['error' => 'Method not allowed'], 405);
}

$first = trim($input['first_name'] ?? $user['first_name'] ?? '');
$last = trim($input['last_name'] ?? $user['last_name'] ?? '');
$phone = trim($input['phone'] ?? $user['phone'] ?? '');
$password = $input['password'] ?? '';

$pdo = gogo_db();

$sql = 'UPDATE users SET first_name = :first, last_name = :last, phone = :phone';
$params = [
    ':first' => $first,
    ':last' => $last,
    ':phone' => $phone,
    ':id' => $user['id'],
];

if ($password !== '') {
    $sql .= ', password_hash = :pass';
    $params[':pass'] = password_hash($password, PASSWORD_DEFAULT);
}

$sql .= ' WHERE id = :id';
$stmt = $pdo->prepare($sql);
$stmt->execute($params);

// Refresh user cache
$_SESSION['user_id'] = $user['id'];
$updated = gogo_current_user();

// Sync to JSON role file
$roleFile = $user['role'] === 'admin' ? __DIR__ . '/../JSON/admins.json' : __DIR__ . '/../JSON/costumers.json';
if (is_readable($roleFile)) {
    $data = json_decode((string) file_get_contents($roleFile), true);
    if (!is_array($data)) {
        $data = [];
    }
} else {
    $data = [];
}

$found = false;
$maxId = 0;
foreach ($data as &$row) {
    if (!isset($row['email'])) {
        continue;
    }
    if (isset($row['id'])) {
        $maxId = max($maxId, (int) $row['id']);
    }
    if (strtolower($row['email']) === strtolower($updated['email'])) {
        $row['first_name'] = $first;
        $row['last_name'] = $last;
        $row['phone'] = $phone;
        if (!isset($row['id']) || (int) $row['id'] === 0) {
            $row['id'] = (int) $updated['id'];
        }
        $found = true;
        break;
    }
}
unset($row);

if (!$found) {
    $data[] = [
        'id' => (int) $updated['id'] ?: ($maxId + 1),
        'email' => $updated['email'],
        'first_name' => $first,
        'last_name' => $last,
        'phone' => $phone,
    ];
}

// Backfill missing ids
$maxId = 0;
foreach ($data as &$row) {
    if (isset($row['id']) && (int)$row['id'] > 0) {
        $maxId = max($maxId, (int)$row['id']);
    }
}
unset($row);
foreach ($data as &$row) {
    if (!isset($row['id']) || (int)$row['id'] === 0) {
        $maxId++;
        $row['id'] = $maxId;
    }
}
unset($row);

file_put_contents($roleFile, json_encode($data, JSON_PRETTY_PRINT));

json_out(['ok' => true, 'user' => $updated]);
