<?php
// PHP/admin-menu-list.php
// Admin menu list with authentication

require_once __DIR__ . '/../PHP/db.php';
$admin = gogo_require_login('admin');

// Include the HTML template
include __DIR__ . '/admin-menu-list.html';
