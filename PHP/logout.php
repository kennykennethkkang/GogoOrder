<?php
// PHP/logout.php
// Handle user logout and redirect to login page.

declare(strict_types=1);

require_once __DIR__ . '/auth.php';

$adminRedirect = isset($_SESSION['admin_redirect']);
gogo_logout();

// Determine correct login path based on current location
$loginPath = '/HTML/login.php';
if (strpos($_SERVER['PHP_SELF'], '/HTML/') !== false) {
    $loginPath = 'login.php';
} elseif (strpos($_SERVER['PHP_SELF'], '/PHP/') !== false) {
    $loginPath = '../HTML/login.php';
}

// If admin redirect was requested, add query parameter
if ($adminRedirect) {
    $loginPath .= (strpos($loginPath, '?') !== false ? '&' : '?') . 'admin=1';
}

header('Location: ' . $loginPath);
exit;

