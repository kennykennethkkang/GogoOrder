<?php
// Admin auth - handles admin login flow
require_once __DIR__ . '/../PHP/db.php';
$user = gogo_current_user();

// If already logged in as admin, go directly to dashboard
if ($user && $user['role'] === 'admin') {
    header('Location: admin-dashboard.php');
    exit;
}

// If logged in as customer, show message and redirect to logout
if ($user) {
    // Redirect to logout, which will then go to login
    $_SESSION['admin_redirect'] = true;
    header('Location: ../PHP/logout.php');
    exit;
}

// Not logged in, go to login page (which handles both customer and admin)
header('Location: login.php');
exit;
?>
