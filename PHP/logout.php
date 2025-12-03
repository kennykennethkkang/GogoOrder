<?php
require_once __DIR__ . '/auth.php';

gogo_logout();
header('Location: /HTML/login.php');
exit;

