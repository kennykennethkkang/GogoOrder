<?php
// PHP/api-menu.php
// CRUD endpoints for menu items.

declare(strict_types=1);

require_once __DIR__ . '/auth.php';

header('Content-Type: application/json');

$pdo = gogo_db();
$method = $_SERVER['REQUEST_METHOD'];

// Support JSON or multipart form with _method override
$rawInput = json_decode((string) file_get_contents('php://input'), true);
$input = is_array($rawInput) ? $rawInput : [];
if (!empty($_POST)) {
    $input = array_merge($input, $_POST);
}
if (isset($input['_method']) && strtoupper($input['_method']) === 'PATCH') {
    $method = 'PATCH';
}

function saveMenuJson(array $item, bool $isUpdate = false): void
{
    $jsonPath = __DIR__ . '/../JSON/menu.json';
    $data = [];
    if (is_readable($jsonPath)) {
        $decoded = json_decode((string) file_get_contents($jsonPath), true);
        if (is_array($decoded)) {
            $data = $decoded;
        }
    }

    $found = false;
    foreach ($data as &$row) {
        if ($isUpdate && isset($row['id']) && (int) $row['id'] === (int) $item['id']) {
            $row = $item;
            $found = true;
            break;
        }
    }
    unset($row);

    if (!$isUpdate) {
        $data[] = $item;
    } elseif (!$found) {
        $data[] = $item;
    }

    file_put_contents($jsonPath, json_encode($data, JSON_PRETTY_PRINT));
}

function handleUpload(string $field = 'image_file', int $maxBytes = 5_000_000, string $category = ''): ?string
{
    if (!isset($_FILES[$field])) {
        return null;
    }

    $file = $_FILES[$field];
    if ($file['error'] === UPLOAD_ERR_NO_FILE) {
        return null;
    }
    if ($file['error'] !== UPLOAD_ERR_OK) {
        return null;
    }

    if ($file['size'] > $maxBytes) {
        return null;
    }

    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    $allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    if ($ext === '' || !in_array($ext, $allowed, true)) {
        return null;
    }

    $safeCat = $category !== '' ? preg_replace('/[^a-z0-9_-]+/i', '', strtolower($category)) : '';
    $uploadDir = __DIR__ . '/../img/uploads' . ($safeCat ? '/' . $safeCat : '');
    if (!is_dir($uploadDir) && !mkdir($uploadDir, 0777, true) && !is_dir($uploadDir)) {
        return null;
    }

    $targetName = uniqid('upload_', true) . '.' . $ext;
    $targetPath = $uploadDir . '/' . $targetName;
    if (!move_uploaded_file($file['tmp_name'], $targetPath)) {
        return null;
    }

    $relative = 'img/uploads/' . ($safeCat ? $safeCat . '/' : '') . $targetName;
    return $relative;
}

function json_out(array $data, int $code = 200): void
{
    http_response_code($code);
    echo json_encode($data);
    exit;
}

if ($method === 'GET') {
    $query = trim($_GET['search'] ?? '');
    $category = trim($_GET['category'] ?? '');

    $sql = 'SELECT id, name, price, category, description, image_url FROM menu_items';
    $params = [];
    $clauses = [];

    if ($query !== '') {
        $clauses[] = '(LOWER(name) LIKE :q OR LOWER(category) LIKE :q)';
        $params[':q'] = '%' . strtolower($query) . '%';
    }

    if ($category !== '') {
        $clauses[] = 'LOWER(category) = :cat';
        $params[':cat'] = strtolower($category);
    }

    if ($clauses) {
        $sql .= ' WHERE ' . implode(' AND ', $clauses);
    }

    $sql .= ' ORDER BY id DESC';

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);

    json_out(['items' => $items]);
}

if ($method === 'POST') {
    gogo_assert_admin();

    $name = trim($input['name'] ?? '');
    $price = (float) ($input['price'] ?? 0);
    if ($name === '' || $price <= 0) {
        json_out(['error' => 'Name and price are required'], 400);
    }

    $category = trim($input['category'] ?? '');
    $imageUpload = handleUpload('image_file', 5_000_000, $category);
    if (isset($_FILES['image_file']) && $_FILES['image_file']['error'] !== UPLOAD_ERR_NO_FILE && !$imageUpload) {
        json_out(['error' => 'Image upload failed. Use jpg/png/gif/webp under 5MB.'], 400);
    }
    $imageUrl = $imageUpload ?? trim($input['image'] ?? '');

    $stmt = $pdo->prepare('
        INSERT INTO menu_items (name, price, category, description, image_url)
        VALUES (:name, :price, :category, :description, :image)
    ');

    $stmt->execute([
        ':name' => $name,
        ':price' => $price,
        ':category' => $category,
        ':description' => trim($input['description'] ?? ''),
        ':image' => $imageUrl,
    ]);

    $newId = (int) $pdo->lastInsertId();

    // Sync to menu.json
    $jsonItem = [
        'id' => $newId,
        'name' => $name,
        'price' => $price,
        'category' => $category,
        'description' => trim($input['description'] ?? ''),
        'image' => $imageUrl,
    ];
    saveMenuJson($jsonItem, false);

    json_out(['id' => $newId, 'image_url' => $imageUrl]);
}

if ($method === 'PUT' || $method === 'PATCH') {
    gogo_assert_admin();
    $id = (int) ($_GET['id'] ?? ($input['id'] ?? 0));
    if ($id <= 0) {
        json_out(['error' => 'Missing id'], 400);
    }

    $stmt = $pdo->prepare('SELECT * FROM menu_items WHERE id = :id LIMIT 1');
    $stmt->execute([':id' => $id]);
    $existing = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$existing) {
        json_out(['error' => 'Item not found'], 404);
    }

    $category = trim($input['category'] ?? $existing['category'] ?? '');
    $imageUpload = handleUpload('image_file', 5_000_000, $category);
    if (isset($_FILES['image_file']) && $_FILES['image_file']['error'] !== UPLOAD_ERR_NO_FILE && !$imageUpload) {
        json_out(['error' => 'Image upload failed. Use jpg/png/gif/webp under 5MB.'], 400);
    }
    $newImage = $imageUpload ?? trim($input['image'] ?? '');
    if ($newImage === '' && isset($existing['image_url'])) {
        $newImage = $existing['image_url'];
    }

    $fields = [
        'name' => trim($input['name'] ?? ''),
        'price' => isset($input['price']) ? (float) $input['price'] : null,
        'category' => trim($input['category'] ?? ''),
        'description' => trim($input['description'] ?? ''),
        'image_url' => $newImage,
    ];

    $stmt = $pdo->prepare('
        UPDATE menu_items
        SET name = :name, price = :price, category = :category, description = :description, image_url = :image
        WHERE id = :id
    ');

    $stmt->execute([
        ':name' => $fields['name'],
        ':price' => $fields['price'] ?? 0,
        ':category' => $category,
        ':description' => $fields['description'],
        ':image' => $fields['image_url'],
        ':id' => $id,
    ]);

    // Sync to menu.json
    $jsonItem = [
        'id' => $id,
        'name' => $fields['name'],
        'price' => $fields['price'],
        'category' => $category,
        'description' => $fields['description'],
        'image' => $fields['image_url'],
    ];
    saveMenuJson($jsonItem, true);

    json_out(['ok' => true]);
}

if ($method === 'DELETE') {
    gogo_assert_admin();
    $id = (int) ($_GET['id'] ?? ($input['id'] ?? 0));
    if ($id <= 0) {
        json_out(['error' => 'Missing id'], 400);
    }

    $stmt = $pdo->prepare('DELETE FROM menu_items WHERE id = :id');
    $stmt->execute([':id' => $id]);
    json_out(['ok' => true]);
}

json_out(['error' => 'Unsupported request'], 405);
