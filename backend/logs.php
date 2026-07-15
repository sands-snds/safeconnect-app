<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// GET Sign In Logs
if ($method === 'GET' && $action === 'signin') {
    $stmt = $pdo->query("SELECT * FROM signin_logs ORDER BY id DESC");
    echo json_encode($stmt->fetchAll());
}

// GET Admin Logs
else if ($method === 'GET' && $action === 'admin') {
    $stmt = $pdo->query("SELECT * FROM admin_logs ORDER BY id DESC");
    echo json_encode($stmt->fetchAll());
}

else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid action']);
}
