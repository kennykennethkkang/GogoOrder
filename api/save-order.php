<?php
// API endpoint to save orders to orders.json
// This file should be placed in the api/ directory

// Set headers first
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Log the request method for debugging
$requestMethod = $_SERVER['REQUEST_METHOD'] ?? 'UNKNOWN';
error_log('Request method: ' . $requestMethod);

// Handle GET request for testing
if ($requestMethod === 'GET') {
    echo json_encode([
        'status' => 'API endpoint is working',
        'method' => 'GET',
        'message' => 'Use POST to save orders',
        'file_path' => __DIR__ . '/../json/orders.json',
        'file_exists' => file_exists(__DIR__ . '/../json/orders.json')
    ]);
    exit;
}

// Allow POST and OPTIONS
if ($requestMethod !== 'POST' && $requestMethod !== 'OPTIONS') {
    http_response_code(405);
    echo json_encode([
        'error' => 'Method not allowed',
        'received_method' => $requestMethod,
        'allowed_methods' => 'POST, GET, OPTIONS',
        'server_method' => $_SERVER['REQUEST_METHOD'] ?? 'not set'
    ]);
    exit;
}

// Get the JSON input
$input = file_get_contents('php://input');

// Log for debugging
error_log('Received order data length: ' . strlen($input));
error_log('Received order data (first 500 chars): ' . substr($input, 0, 500));

// Handle GET request for testing
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo json_encode([
        'status' => 'API is working',
        'method' => 'GET',
        'message' => 'Use POST method to save orders',
        'test' => true
    ]);
    exit;
}

// For POST, we need the input
if (empty($input)) {
    http_response_code(400);
    echo json_encode([
        'error' => 'No data received',
        'content_type' => $_SERVER['CONTENT_TYPE'] ?? 'not set',
        'request_method' => $_SERVER['REQUEST_METHOD']
    ]);
    exit;
}

$newOrder = json_decode($input, true);

if (!$newOrder) {
    $jsonError = json_last_error_msg();
    error_log('JSON decode error: ' . $jsonError);
    http_response_code(400);
    echo json_encode([
        'error' => 'Invalid JSON', 
        'json_error' => $jsonError,
        'received' => substr($input, 0, 200) // First 200 chars for debugging
    ]);
    exit;
}

// Path to orders.json file (relative to this PHP file)
$ordersFile = __DIR__ . '/../json/orders.json';

// Log file path for debugging
error_log('Orders file path: ' . $ordersFile);
error_log('File exists: ' . (file_exists($ordersFile) ? 'yes' : 'no'));
error_log('File writable: ' . (is_writable(dirname($ordersFile)) ? 'yes' : 'no'));

// Check if directory exists, create if not
$ordersDir = dirname($ordersFile);
if (!is_dir($ordersDir)) {
    if (!mkdir($ordersDir, 0755, true)) {
        error_log('Failed to create directory: ' . $ordersDir);
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create directory', 'dir' => $ordersDir]);
        exit;
    }
}

// Read existing orders
$orders = [];
if (file_exists($ordersFile)) {
    $ordersJson = file_get_contents($ordersFile);
    if ($ordersJson !== false) {
        $decoded = json_decode($ordersJson, true);
        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            $orders = $decoded;
        }
    }
}

// Check if order_id already exists (prevent duplicates)
$orderExists = false;
if (isset($newOrder['order_id'])) {
    foreach ($orders as $existingOrder) {
        if (isset($existingOrder['order_id']) && $existingOrder['order_id'] === $newOrder['order_id']) {
            $orderExists = true;
            break;
        }
    }
}

if (!$orderExists) {
    // Add new order
    $orders[] = $newOrder;
    
    // Write back to file with pretty print
    $jsonData = json_encode($orders, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    $result = file_put_contents($ordersFile, $jsonData);
    
    error_log('Write result: ' . ($result !== false ? 'success (' . $result . ' bytes)' : 'failed'));
    
    if ($result === false) {
        error_log('Failed to write to file. Check permissions.');
        http_response_code(500);
        echo json_encode([
            'error' => 'Failed to write to file', 
            'file' => $ordersFile,
            'writable' => is_writable($ordersFile) || is_writable(dirname($ordersFile))
        ]);
        exit;
    }
    
    error_log('Order saved successfully. Order ID: ' . $newOrder['order_id']);
    
    http_response_code(200);
    echo json_encode([
        'success' => true, 
        'order_id' => $newOrder['order_id'],
        'message' => 'Order saved successfully',
        'file' => $ordersFile
    ]);
} else {
    // Order already exists
    http_response_code(200);
    echo json_encode([
        'success' => true, 
        'order_id' => $newOrder['order_id'],
        'message' => 'Order already exists'
    ]);
}
?>

