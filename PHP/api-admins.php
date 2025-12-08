<?php
// PHP/api-admins.php
// Create new admin users (only accessible by existing admins).

declare(strict_types=1);

require_once __DIR__ . '/auth.php';

header('Content-Type: application/json');
gogo_assert_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$input = json_decode((string) file_get_contents('php://input'), true) ?? $_POST;

$first = trim($input['first_name'] ?? '');
$last = trim($input['last_name'] ?? '');
$email = strtolower(trim($input['email'] ?? ''));
$phone = trim($input['phone'] ?? '');

if ($first === '' || $last === '' || $email === '' || $phone === '') {
    http_response_code(400);
    echo json_encode(['error' => 'All fields are required.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email.']);
    exit;
}

// Generate a temporary password for the new admin
$tempPassword = bin2hex(random_bytes(4)); // 8 hex chars

$pdo = gogo_db();
$hash = password_hash($tempPassword, PASSWORD_DEFAULT);

// Check uniqueness
$exists = $pdo->prepare('SELECT id FROM users WHERE email = :email LIMIT 1');
$exists->execute([':email' => $email]);
if ($exists->fetch(PDO::FETCH_ASSOC)) {
    http_response_code(400);
    echo json_encode(['error' => 'Email already exists.']);
    exit;
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
    ':pass' => $hash,
    ':role' => 'admin',
]);
$dbId = (int) $pdo->lastInsertId();
gogo_store_credentials($pdo, $dbId, $email, $hash, 'admin');

// Sync to JSON/admins.json
$jsonPath = __DIR__ . '/../JSON/admins.json';
$admins = [];
if (is_readable($jsonPath)) {
    $decoded = json_decode((string) file_get_contents($jsonPath), true);
    if (is_array($decoded)) {
        $admins = $decoded;
    }
}

$maxId = 0;
foreach ($admins as &$a) {
    if (!isset($a['id']) || (int)$a['id'] === 0) {
        $maxId++;
        $a['id'] = $maxId;
    } else {
        $maxId = max($maxId, (int)$a['id']);
    }
}
unset($a);

$admins[] = [
    'id' => $dbId ?: ($maxId + 1),
    'first_name' => $first,
    'last_name' => $last,
    'email' => $email,
    'phone' => $phone,
];

file_put_contents($jsonPath, json_encode($admins, JSON_PRETTY_PRINT));

echo json_encode([
    'ok' => true,
    'generated_password' => $tempPassword,
]);
