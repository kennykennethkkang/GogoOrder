<?php
// PHP/api-auth.php
// JSON API for auth actions.

declare(strict_types=1);

require_once __DIR__ . '/auth.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode((string) file_get_contents('php://input'), true) ?? [];
$action = $_GET['action'] ?? $input['action'] ?? null;

function respond(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data);
    exit;
}

if ($method === 'GET') {
    $user = gogo_current_user();
    respond(['user' => $user]);
}

if ($method === 'POST') {
    if ($action === 'login') {
        $email = $input['email'] ?? ($_POST['email'] ?? '');
        $password = $input['password'] ?? ($_POST['password'] ?? '');
        $role = $input['role'] ?? ($_POST['role'] ?? null);

        $result = gogo_login_user($email, $password, $role ?: null);
        if (!$result['ok']) {
            respond(['error' => $result['message']], 400);
        }
        respond(['user' => $result['user']]);
    }

    if ($action === 'signup') {
        $role = $input['role'] ?? ($_POST['role'] ?? 'customer');
        $result = gogo_register_user($input ?: $_POST, $role);
        if (!$result['ok']) {
            respond(['error' => $result['message']], 400);
        }
        respond(['user' => $result['user']]);
    }

    if ($action === 'logout') {
        gogo_logout();
        respond(['ok' => true]);
    }
}

respond(['error' => 'Unsupported request'], 405);

