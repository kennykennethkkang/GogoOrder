<?php
// PHP/utils.php
// Shared utility functions

declare(strict_types=1);

function json_response(array $data, int $code = 200): void
{
    // simple helper to send json back and stop the script
    http_response_code($code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}
