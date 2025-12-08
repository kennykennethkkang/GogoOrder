<?php
// PHP/api-orders.php
// Order creation + listing for customers and admins.

declare(strict_types=1);

require_once __DIR__ . '/auth.php';
require_once __DIR__ . '/utils.php';

$pdo = gogo_db();
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode((string) file_get_contents('php://input'), true) ?? [];

function sync_order_json(array $order, array $items, string $status): void
{
    $jsonPath = __DIR__ . '/../JSON/orders.json';
    $data = [];
    if (is_readable($jsonPath)) {
        $decoded = json_decode((string) file_get_contents($jsonPath), true);
        if (is_array($decoded)) {
            $data = $decoded;
        }
    }

    // Find the next available ID in case the incoming payload is missing one.
    $maxId = 0;
    foreach ($data as $row) {
        $maxId = max($maxId, (int) ($row['order_id'] ?? 0));
    }

    // Map line items
    $mappedItems = [];
    foreach ($items as $it) {
        $customizations = '';
        if (!empty($it['customizations'])) {
            $customizations = $it['customizations'];
        }
        $mappedItems[] = [
            'id' => $it['menu_item_id'] ?? $it['id'] ?? null,
            'name' => $it['item_name'] ?? $it['name'] ?? '',
            'qty' => $it['qty'] ?? 0,
            'price' => $it['price'] ?? 0,
            'description' => $it['description'] ?? '',
            'customizations' => $customizations,
        ];
    }

    $entry = [
        'order_id' => $order['id'] ?? ($maxId + 1),
        'name' => $order['customer_name'] ?? '',
        'items' => $mappedItems,
        'total' => $order['total'],
        'status' => $status,
        'timestamp' => $order['created_at'] ?? date('Y-m-d H:i:s'),
        'order_type' => $order['order_type'] ?? 'pickup',
        'scheduled_time' => $order['scheduled_time'] ?? '',
        'address' => $order['address'] ?? '',
    ];

    // Preserve user_id if available
    if (isset($order['user_id'])) {
        $entry['user_id'] = $order['user_id'];
    }

    $found = false;
    foreach ($data as &$row) {
        if ((int) ($row['order_id'] ?? 0) === (int) $order['id']) {
            $row = array_merge($row, $entry);
            $found = true;
            break;
        }
    }
    unset($row);

    if (!$found) {
        $data[] = $entry;
    }

    file_put_contents($jsonPath, json_encode($data, JSON_PRETTY_PRINT));
}

if ($method === 'GET') {
    $user = gogo_require_login();
    $isAdmin = $user['role'] === 'admin';
    $onlyMine = isset($_GET['mine']) && $_GET['mine'] !== '' ? true : false;

    $sql = 'SELECT * FROM orders';
    $params = [];
    if (!$isAdmin || $onlyMine) {
        $sql .= ' WHERE user_id = :uid';
        $params[':uid'] = $user['id'];
    }
    $sql .= ' ORDER BY created_at DESC';

    $ordersStmt = $pdo->prepare($sql);
    $ordersStmt->execute($params);
    $orders = $ordersStmt->fetchAll(PDO::FETCH_ASSOC);

    $orderIds = array_column($orders, 'id');
    $itemsByOrder = [];
    if ($orderIds) {
        $placeholders = implode(',', array_fill(0, count($orderIds), '?'));
        $itemsStmt = $pdo->prepare('SELECT * FROM order_items WHERE order_id IN (' . $placeholders . ') ORDER BY id ASC');
        $itemsStmt->execute($orderIds);
        while ($row = $itemsStmt->fetch(PDO::FETCH_ASSOC)) {
            $itemsByOrder[$row['order_id']][] = $row;
        }
    }

    foreach ($orders as &$order) {
        $order['items'] = $itemsByOrder[$order['id']] ?? [];
    }

    json_response(['orders' => $orders]);
}

if ($method === 'POST') {
    $user = gogo_require_login();

    $items = $input['items'] ?? [];
    if (!is_array($items) || count($items) === 0) {
        json_response(['error' => 'Order must include items'], 400);
    }

    $orderType = strtolower(trim($input['order_type'] ?? 'pickup'));
    if (!in_array($orderType, ['pickup', 'delivery'], true)) {
        $orderType = 'pickup';
    }
    $scheduledTime = trim($input['scheduled_time'] ?? '');
    $address = trim($input['address'] ?? '');
    if ($orderType === 'delivery' && $address === '') {
        json_response(['error' => 'Delivery address is required'], 400);
    }

    $ids = array_column($items, 'id');
    $ids = array_filter(array_map('intval', $ids), static fn ($v) => $v > 0);
    if (!$ids) {
        json_response(['error' => 'Invalid items'], 400);
    }

    $placeholder = implode(',', array_fill(0, count($ids), '?'));
    $menuStmt = $pdo->prepare('SELECT id, name, price, image_url FROM menu_items WHERE id IN (' . $placeholder . ')');
    $menuStmt->execute($ids);
    $menuItems = [];
    while ($row = $menuStmt->fetch(PDO::FETCH_ASSOC)) {
        $menuItems[$row['id']] = $row;
    }

    $subtotal = 0;
    $lineItems = [];
    foreach ($items as $item) {
        $id = (int) ($item['id'] ?? 0);
        $qty = (int) ($item['qty'] ?? 1);
        if ($qty < 1 || !isset($menuItems[$id])) {
            continue;
        }
        $price = (float) $menuItems[$id]['price'];
        $subtotal += $price * $qty;
        $description = trim($item['description'] ?? $menuItems[$id]['description'] ?? '');
        $customizationsData = [];
        if (isset($item['customizations']) && is_array($item['customizations']) && count($item['customizations']) > 0) {
            $customizationsData['with'] = $item['customizations'];
        }
        if (isset($item['removedIngredients']) && is_array($item['removedIngredients']) && count($item['removedIngredients']) > 0) {
            $customizationsData['without'] = $item['removedIngredients'];
        }
        $customizations = !empty($customizationsData) ? json_encode($customizationsData) : '';
        $lineItems[] = [
            'menu_item_id' => $id,
            'item_name' => $menuItems[$id]['name'],
            'qty' => $qty,
            'price' => $price,
            'description' => $description,
            'customizations' => $customizations,
        ];
    }

    if (!$lineItems) {
        json_response(['error' => 'No valid items to order'], 400);
    }

    $pdo->beginTransaction();
    try {
        $orderStmt = $pdo->prepare('
            INSERT INTO orders (user_id, customer_name, total, status, order_type, scheduled_time, address)
            VALUES (:uid, :name, :total, :status, :otype, :stime, :addr)
        ');

        $customerName = trim($input['name'] ?? '');
        if ($customerName === '') {
            $customerName = trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? ''));
        }

        $orderStmt->execute([
            ':uid' => $user['id'],
            ':name' => $customerName,
            ':total' => $subtotal,
            ':status' => 'Pending',
            ':otype' => $orderType,
            ':stime' => $scheduledTime,
            ':addr' => $address,
        ]);

        $orderId = (int) $pdo->lastInsertId();

        $itemStmt = $pdo->prepare('
            INSERT INTO order_items (order_id, menu_item_id, item_name, qty, price, description, customizations)
            VALUES (:order_id, :menu_item_id, :name, :qty, :price, :description, :customizations)
        ');

        foreach ($lineItems as $li) {
            $itemStmt->execute([
                ':order_id' => $orderId,
                ':menu_item_id' => $li['menu_item_id'],
                ':name' => $li['item_name'],
                ':qty' => $li['qty'],
                ':price' => $li['price'],
                ':description' => $li['description'] ?? '',
                ':customizations' => $li['customizations'] ?? '',
            ]);
        }

        $pdo->commit();
        $orderRow = [
            'id' => $orderId,
            'user_id' => $user['id'],
            'customer_name' => $customerName,
            'total' => $subtotal,
            'created_at' => date('Y-m-d H:i:s'),
            'order_type' => $orderType,
            'scheduled_time' => $scheduledTime,
            'address' => $address,
        ];
        sync_order_json($orderRow, $lineItems, 'Pending');
        json_response(['order_id' => $orderId, 'total' => $subtotal]);
    } catch (Throwable $e) {
        $pdo->rollBack();
        json_response(['error' => 'Could not save order'], 500);
    }
}

if ($method === 'PATCH' || $method === 'PUT') {
    $current = gogo_require_login();
    $orderId = (int) ($_GET['id'] ?? ($input['id'] ?? 0));
    $status = trim($input['status'] ?? '');

    if ($orderId <= 0 || $status === '') {
        json_response(['error' => 'Missing id or status'], 400);
    }

    // Only admin or owner can update
    $check = $pdo->prepare('SELECT user_id, order_type, scheduled_time, customer_name, address FROM orders WHERE id = :id LIMIT 1');
    $check->execute([':id' => $orderId]);
    $row = $check->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        json_response(['error' => 'Order not found'], 404);
    }
    if ($current['role'] !== 'admin' && (int) $row['user_id'] !== (int) $current['id']) {
        json_response(['error' => 'Forbidden'], 403);
    }

    $stmt = $pdo->prepare('UPDATE orders SET status = :status WHERE id = :id');
    $stmt->execute([
        ':status' => $status,
        ':id' => $orderId,
    ]);

    // Pull items for JSON sync
    $itemsStmt = $pdo->prepare('SELECT * FROM order_items WHERE order_id = :oid');
    $itemsStmt->execute([':oid' => $orderId]);
    $items = $itemsStmt->fetchAll(PDO::FETCH_ASSOC);

    $orderRow = [
        'id' => $orderId,
        'user_id' => $row['user_id'] ?? $current['id'],
        'customer_name' => $row['customer_name'] ?? ($current['first_name'] ?? ''),
        'order_type' => $row['order_type'] ?? 'pickup',
        'scheduled_time' => $row['scheduled_time'] ?? '',
        'address' => $row['address'] ?? '',
        'total' => 0,
    ];
    $total = 0;
    foreach ($items as $it) {
        $total += ($it['price'] ?? 0) * ($it['qty'] ?? 0);
    }
    $orderRow['total'] = $total;
    sync_order_json($orderRow, $items, $status);

    json_response(['ok' => true]);
}

json_response(['error' => 'Unsupported request'], 405);
