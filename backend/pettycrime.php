<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// CREATE Petty Crime Report
if ($method === 'POST' && $action === 'create') {
    $data = json_decode(file_get_contents('php://input'), true);

    $crimeType = trim($data['crimeType'] ?? '');
    $fullName  = trim($data['fullname'] ?? '');
    $location  = trim($data['location'] ?? '');
    $description = trim($data['description'] ?? '');

    if (empty($crimeType) || empty($fullName) || empty($location) || empty($description)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Crime type, location, and description are required']);
        exit;
    }

    try {
        $stmt = $pdo->prepare("
            INSERT INTO petty_crimes 
            (crime_type, reporter_name, contact_number, location, description, suspect_info) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $crimeType,
            $fullName,
            $data['contact'] ?? null,
            $location,
            $description,
            $data['suspectInfo'] ?? null
        ]);

        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to submit report: ' . $e->getMessage()]);
    }
}

// GET All Petty Crime Reports
else if ($method === 'GET' && $action === 'list') {
    $stmt = $pdo->query("SELECT * FROM petty_crimes ORDER BY id DESC");
    echo json_encode($stmt->fetchAll());
}

// UPDATE Status
else if ($method === 'POST' && $action === 'update-status') {
    $data = json_decode(file_get_contents('php://input'), true);

    $stmt = $pdo->prepare("UPDATE petty_crimes SET status = ? WHERE id = ?");
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