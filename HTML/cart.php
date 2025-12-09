<?php
// PHP/cart.php
// Cart page with authentication and user data

require_once __DIR__ . '/../PHP/db.php';
$user = gogo_require_login();
$fullName = trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? ''));

// Include the HTML template
include __DIR__ . '/cart.html';
