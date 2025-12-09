<?php
// PHP/admin-add-admin.php
// Admin add admin with authentication
// tiny loader: makes sure user is admin then serves the html

require_once __DIR__ . '/../PHP/db.php';
$admin = gogo_require_login('admin');

// Include the HTML template
include __DIR__ . '/admin-add-admin.html';
