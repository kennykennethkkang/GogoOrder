<?php
// PHP/login.php
// Login page with authentication check - includes HTML template

require_once __DIR__ . '/../PHP/db.php';
if (gogo_current_user()) {
    header('Location: ../index.php');
    exit;
}

// Include the HTML template
include __DIR__ . '/login.html';
