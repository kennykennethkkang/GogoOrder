<?php
// PHP/login.php
// Login page with authentication check - includes HTML template

require_once __DIR__ . '/../PHP/db.php';
$user = gogo_current_user();

// If already logged in, redirect based on role
if ($user) {
    if ($user['role'] === 'admin') {
        header('Location: admin-dashboard.php');
    } else {
        header('Location: ../index.php');
    }
    exit;
}

// Include the HTML template
include __DIR__ . '/login.html';
