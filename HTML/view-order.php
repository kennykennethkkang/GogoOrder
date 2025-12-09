<?php
// PHP/view-order.php
// Orders page with authentication and user data
// small glue file: checks login, figures out the user name, then loads the html template

require_once __DIR__ . '/../PHP/db.php';
$user = gogo_require_login();
$fullName = trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? ''));

// Include the HTML template
include __DIR__ . '/view-order.html';
