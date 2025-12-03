<?php
// Test endpoint to check if PHP is working and file permissions
header('Content-Type: application/json');

$ordersFile = __DIR__ . '/../json/orders.json';
$ordersDir = dirname($ordersFile);

$info = [
    'php_working' => true,
    'orders_file' => $ordersFile,
    'file_exists' => file_exists($ordersFile),
    'file_readable' => file_exists($ordersFile) ? is_readable($ordersFile) : false,
    'file_writable' => file_exists($ordersFile) ? is_writable($ordersFile) : false,
    'dir_exists' => is_dir($ordersDir),
    'dir_writable' => is_dir($ordersDir) ? is_writable($ordersDir) : false,
    'current_user' => get_current_user(),
    'file_permissions' => file_exists($ordersFile) ? substr(sprintf('%o', fileperms($ordersFile)), -4) : 'N/A',
    'dir_permissions' => is_dir($ordersDir) ? substr(sprintf('%o', fileperms($ordersDir)), -4) : 'N/A'
];

echo json_encode($info, JSON_PRETTY_PRINT);
?>

