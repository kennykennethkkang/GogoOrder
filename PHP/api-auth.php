<?php
// PHP/api-auth.php
// JSON API for auth actions.

declare(strict_types=1);

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/utils.php';

$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode((string) file_get_contents('php://input'), true) ?? [];
$action = $_GET['action'] ?? $input['action'] ?? null;

if ($method === 'GET') {
    if ($action === 'get-security-question') {
        $email = $_GET['email'] ?? '';
        $result = gogo_get_security_question($email);
        if (!$result['ok']) {
            json_response(['error' => $result['message']], 400);
        }
        json_response($result);
    } else {
        $user = gogo_current_user();
        json_response(['user' => $user]);
    }
}

if ($method === 'POST') {
    if ($action === 'login') {
        $email = $input['email'] ?? ($_POST['email'] ?? '');
        $password = $input['password'] ?? ($_POST['password'] ?? '');
        $role = $input['role'] ?? ($_POST['role'] ?? null);

        $result = gogo_login_user($email, $password, $role ?: null);
        if (!$result['ok']) {
            json_response(['error' => $result['message']], 400);
        }
        json_response(['user' => $result['user']]);
    }

    if ($action === 'signup') {
        $role = $input['role'] ?? ($_POST['role'] ?? 'customer');
        $result = gogo_register_user($input ?: $_POST, $role);
        if (!$result['ok']) {
            json_response(['error' => $result['message']], 400);
        }
        json_response(['user' => $result['user']]);
    }

    if ($action === 'logout') {
        gogo_logout();
        json_response(['ok' => true]);
    }

    if ($action === 'request-reset') {
        $email = $input['email'] ?? ($_POST['email'] ?? '');
        $result = gogo_request_password_reset($email);
        if (!$result['ok']) {
            json_response(['error' => $result['message']], 400);
        }
        json_response($result);
    }

    if ($action === 'reset-by-email') {
        $email = $input['email'] ?? ($_POST['email'] ?? '');
        $securityAnswer = $input['security_answer'] ?? ($_POST['security_answer'] ?? '');
        $password = $input['password'] ?? ($_POST['password'] ?? '');
        $result = gogo_reset_password_by_email($email, $securityAnswer, $password);
        if (!$result['ok']) {
            json_response(['error' => $result['message']], 400);
        }
        json_response($result);
    }

    if ($action === 'reset-password') {
        $token = $input['token'] ?? ($_POST['token'] ?? '');
        $password = $input['password'] ?? ($_POST['password'] ?? '');
        $result = gogo_reset_password($token, $password);
        if (!$result['ok']) {
            json_response(['error' => $result['message']], 400);
        }
        json_response($result);
    }

    if ($action === 'verify-token') {
        $token = $input['token'] ?? ($_GET['token'] ?? '');
        $result = gogo_verify_reset_token($token);
        if (!$result['ok']) {
            json_response(['error' => $result['message']], 400);
        }
        json_response($result);
    }
}

json_response(['error' => 'Unsupported request'], 405);

