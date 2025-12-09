<?php
// PHP/admin-view-orders.php
// Admin orders view with authentication
// small wrapper: forces admin login then loads the html version

require_once __DIR__ . '/../PHP/db.php';
$admin = gogo_require_login('admin');

// Include the HTML template
include __DIR__ . '/admin-view-orders.html';
