<?php
// PHP/api-orders.php
// Order creation + listing for customers and admins.

declare(strict_types=1);

require_once __DIR__ . '/auth.php';

header('Content-Type: application/json');
$pdo = gogo_db();
$method = $_SERVER['REQUEST_METHOD'];
$input = json_decode((string) file_get_contents('php://input'), true) ?? [];

function out(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data);
    exit;
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

    out(['orders' => $orders]);
}

if ($method === 'POST') {
    $user = gogo_require_login();

    $items = $input['items'] ?? [];
    if (!is_array($items) || count($items) === 0) {
        out(['error' => 'Order must include items'], 400);
    }

    $ids = array_column($items, 'id');
    $ids = array_filter(array_map('intval', $ids), static fn ($v) => $v > 0);
    if (!$ids) {
        out(['error' => 'Invalid items'], 400);
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
        $lineItems[] = [
            'menu_item_id' => $id,
            'item_name' => $menuItems[$id]['name'],
            'qty' => $qty,
            'price' => $price,
        ];
    }

    if (!$lineItems) {
        out(['error' => 'No valid items to order'], 400);
    }

    $pdo->beginTransaction();
    try {
        $orderStmt = $pdo->prepare('
            INSERT INTO orders (user_id, customer_name, total, status)
            VALUES (:uid, :name, :total, :status)
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
        ]);

        $orderId = (int) $pdo->lastInsertId();

        $itemStmt = $pdo->prepare('
            INSERT INTO order_items (order_id, menu_item_id, item_name, qty, price)
            VALUES (:order_id, :menu_item_id, :name, :qty, :price)
        ');

        foreach ($lineItems as $li) {
            $itemStmt->execute([
                ':order_id' => $orderId,
                ':menu_item_id' => $li['menu_item_id'],
                ':name' => $li['item_name'],
                ':qty' => $li['qty'],
                ':price' => $li['price'],
            ]);
        }

        $pdo->commit();
        out(['order_id' => $orderId, 'total' => $subtotal]);
    } catch (Throwable $e) {
        $pdo->rollBack();
        out(['error' => 'Could not save order'], 500);
    }
}

if ($method === 'PATCH' || $method === 'PUT') {
    $current = gogo_require_login();
    $orderId = (int) ($_GET['id'] ?? ($input['id'] ?? 0));
    $status = trim($input['status'] ?? '');

    if ($orderId <= 0 || $status === '') {
        out(['error' => 'Missing id or status'], 400);
    }

    // Only admin or owner can update
    $check = $pdo->prepare('SELECT user_id FROM orders WHERE id = :id LIMIT 1');
    $check->execute([':id' => $orderId]);
    $row = $check->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
        out(['error' => 'Order not found'], 404);
    }
    if ($current['role'] !== 'admin' && (int) $row['user_id'] !== (int) $current['id']) {
        out(['error' => 'Forbidden'], 403);
    }

    $stmt = $pdo->prepare('UPDATE orders SET status = :status WHERE id = :id');
    $stmt->execute([
        ':status' => $status,
        ':id' => $orderId,
    ]);

    out(['ok' => true]);
}

out(['error' => 'Unsupported request'], 405);
