<?php
// PHP/admin-menu-add.php
// Admin add menu item with authentication - includes HTML template

require_once __DIR__ . '/../PHP/db.php';
$admin = gogo_require_login('admin');

// Include the HTML template
include __DIR__ . '/admin-menu-add.html';
