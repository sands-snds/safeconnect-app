<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// CREATE Assistance Request
if ($method === 'POST' && $action === 'create') {
    $data = json_decode(file_get_contents('php://input'), true);

    try {
        $stmt = $pdo->prepare("
            INSERT INTO assistance_requests 
            (request_assistance_type, full_name, contact_number, email_address, 
             current_location, number_of_people_needing_help, urgency_level, 
             describe_your_situation, special_needs) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $data['type'] ?? '',
            $data['fullname'] ?? '',
            $data['contact'] ?? '',
            $data['email'] ?? '',
            $data['location'] ?? '',
            $data['people'] ?? 1,
            $data['urgency'] ?? '',
            $data['situation'] ?? '',
            $data['special'] ?? null
        ]);

        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create request: ' . $e->getMessage()]);
    }
}

// GET All Assistance Requests
else if ($method === 'GET' && $action === 'list') {
    $stmt = $pdo->query("SELECT * FROM assistance_requests ORDER BY id DESC");
    echo json_encode($stmt->fetchAll());
}

// UPDATE Status
else if ($method === 'POST' && $action === 'update-status') {
    $data = json_decode(file_get_contents('php://input'), true);

    $stmt = $pdo->prepare("UPDATE assistance_requests SET status = ? WHERE id = ?");
    if ($stmt->execute([$data['status'], $data['id']])) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false]);
    }
}

else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid action']);
}
