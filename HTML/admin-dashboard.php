<?php
// PHP/admin-dashboard.php
// Admin dashboard with authentication - includes HTML template

require_once __DIR__ . '/../PHP/db.php';
$admin = gogo_require_login('admin');

// Include the HTML template
include __DIR__ . '/admin-dashboard.html';
