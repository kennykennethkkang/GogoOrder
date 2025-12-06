<?php
// PHP/logout.php
// Handle user logout and redirect to login page.

declare(strict_types=1);

require_once __DIR__ . '/auth.php';

gogo_logout();

// Determine correct login path based on current location
$loginPath = '/HTML/login.php';
if (strpos($_SERVER['PHP_SELF'], '/HTML/') !== false) {
    $loginPath = 'login.php';
} elseif (strpos($_SERVER['PHP_SELF'], '/PHP/') !== false) {
    $loginPath = '../HTML/login.php';
}

header('Location: ' . $loginPath);
exit;

