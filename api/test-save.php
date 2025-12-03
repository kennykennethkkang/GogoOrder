<?php
// Simple test to see if PHP is working and can write files
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$method = $_SERVER['REQUEST_METHOD'];
$ordersFile = __DIR__ . '/../json/orders.json';

// Test GET request
if ($method === 'GET') {
    echo json_encode([
        'status' => 'PHP is working',
        'method' => 'GET',
        'file_exists' => file_exists($ordersFile),
        'file_writable' => file_exists($ordersFile) ? is_writable($ordersFile) : false,
        'dir_writable' => is_writable(dirname($ordersFile))
    ]);
    exit;
}

// Test POST request
if ($method === 'POST') {
    $input = file_get_contents('php://input');
    
    // Try to decode JSON
    $data = json_decode($input, true);
    
    if ($data) {
        // Try to read existing orders
        $orders = [];
        if (file_exists($ordersFile)) {
            $existing = file_get_contents($ordersFile);
            $orders = json_decode($existing, true) ?: [];
        }
        
        // Add test order
        $testOrder = [
            'order_id' => 9999,
            'name' => 'Test Order',
            'timestamp' => date('Y-m-d H:i:s'),
            'test' => true
        ];
        $orders[] = $testOrder;
        
        // Try to write
        $result = file_put_contents($ordersFile, json_encode($orders, JSON_PRETTY_PRINT));
        
        echo json_encode([
            'status' => 'POST received',
            'data_received' => !empty($input),
            'json_valid' => $data !== null,
            'write_success' => $result !== false,
            'bytes_written' => $result,
            'test_order_added' => true
        ]);
    } else {
        echo json_encode([
            'status' => 'POST received but invalid JSON',
            'input_length' => strlen($input),
            'input_preview' => substr($input, 0, 200),
            'json_error' => json_last_error_msg()
        ]);
    }
    exit;
}

// Method not allowed
http_response_code(405);
echo json_encode(['error' => 'Method not allowed', 'method' => $method]);
?>

