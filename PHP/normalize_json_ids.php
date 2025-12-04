<?php
// PHP/normalize_json_ids.php
// Utility to normalize IDs across JSON fixtures to prevent collisions/duplicates.

declare(strict_types=1);

$root = dirname(__DIR__);

function loadJson(string $path): array
{
    if (!is_readable($path)) {
        return [];
    }
    $decoded = json_decode((string) file_get_contents($path), true);
    return is_array($decoded) ? $decoded : [];
}

function writeJson(string $path, array $data): void
{
    file_put_contents($path, json_encode($data, JSON_PRETTY_PRINT));
}

function normalizeUsers(string $path): void
{
    $data = loadJson($path);
    $normalized = [];
    $id = 1;
    foreach ($data as $row) {
        $normalized[] = [
            'id' => $id++,
            'first_name' => $row['first_name'] ?? '',
            'last_name' => $row['last_name'] ?? '',
            'email' => $row['email'] ?? '',
            'phone' => $row['phone'] ?? '',
        ];
    }
    writeJson($path, $normalized);
}

function normalizeMenu(string $path): void
{
    $data = loadJson($path);
    $normalized = [];
    $id = 1;
    foreach ($data as $row) {
        $normalized[] = [
            'id' => $id++,
            'name' => $row['name'] ?? '',
            'price' => $row['price'] ?? 0,
            'category' => $row['category'] ?? '',
            'description' => $row['description'] ?? '',
            'image' => $row['image'] ?? ($row['image_url'] ?? ''),
        ];
    }
    writeJson($path, $normalized);
}

function normalizeOrders(string $path): void
{
    $data = loadJson($path);
    $normalized = [];
    $id = 1;
    foreach ($data as $row) {
        $row['order_id'] = $id++;
        $normalized[] = $row;
    }
    writeJson($path, $normalized);
}

normalizeUsers($root . '/JSON/admins.json');
normalizeUsers($root . '/JSON/costumers.json');
normalizeMenu($root . '/JSON/menu.json');
normalizeOrders($root . '/JSON/orders.json');

echo "Normalized IDs for admins, customers, menu, and orders JSON.\n";
