<?php
// PHP/logout.php
// Handle user logout and redirect to login page.

declare(strict_types=1);

require_once __DIR__ . '/auth.php';

$adminRedirect = isset($_SESSION['admin_redirect']);
gogo_logout();

// Determine correct login path based on current location
// figuring out where to send user after logging out based on current path
$loginPath = '/HTML/login.php';
if (strpos($_SERVER['PHP_SELF'], '/HTML/') !== false) {
    $loginPath = 'login.php';
} elseif (strpos($_SERVER['PHP_SELF'], '/PHP/') !== false) {
    $loginPath = '../HTML/login.php';
}

// If admin redirect was requested, add query parameter
// attach admin=1 so the login page knows it came from admin flow
if ($adminRedirect) {
    $loginPath .= (strpos($loginPath, '?') !== false ? '&' : '?') . 'admin=1';
}

header('Location: ' . $loginPath);
exit;
