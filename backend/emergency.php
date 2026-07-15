<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// CREATE Emergency Report
if ($method === 'POST' && $action === 'create') {
    $data = json_decode(file_get_contents('php://input'), true);

    try {
        $stmt = $pdo->prepare("
            INSERT INTO emergency_reports 
            (emergency_type, severity, reporter_name, contact_number, location, 
             incident_details, number_of_people_affected, photo_url) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $data['emergencyType'] ?? '',
            $data['severity'] ?? '',
            $data['name'] ?? '',
            $data['contact'] ?? '',
            $data['location'] ?? '',
            $data['details'] ?? '',
            $data['people'] ?? 0,
            $data['photoUrl'] ?? null
        ]);

        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Failed to create report: ' . $e->getMessage()]);
    }
}

// GET All Emergency Reports
else if ($method === 'GET' && $action === 'list') {
    $stmt = $pdo->query("SELECT * FROM emergency_reports ORDER BY id DESC");
    echo json_encode($stmt->fetchAll());
}

// UPDATE Status
else if ($method === 'POST' && $action === 'update-status') {
    $data = json_decode(file_get_contents('php://input'), true);

    $stmt = $pdo->prepare("UPDATE emergency_reports SET status = ? WHERE id = ?");
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
