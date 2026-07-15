<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// CREATE Volunteer Application
if ($method === 'POST' && $action === 'create') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $stmt = $pdo->prepare("
        INSERT INTO volunteer_applications 
        (full_name, email_address, date_of_birth, address, contact_number, 
         skills, availability) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    
    if ($stmt->execute([
        $data['fullName'],
        $data['email'],
        $data['dob'],
        $data['address'],
        $data['contact'],
        $data['skills'],
        $data['availability']
    ])) {
        echo json_encode(['success' => true, 'id' => $pdo->lastInsertId()]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to submit application']);
    }
}

// GET All Volunteer Applications
else if ($method === 'GET' && $action === 'list') {
    $stmt = $pdo->query("SELECT * FROM volunteer_applications ORDER BY id DESC");
    $applications = $stmt->fetchAll();
    echo json_encode($applications);
}

// UPDATE Status
else if ($method === 'POST' && $action === 'update-status') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $stmt = $pdo->prepare("UPDATE volunteer_applications SET status = ? WHERE id = ?");
    if ($stmt->execute([$data['status'], $data['id']])) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false]);
    }
}

else {
    echo json_encode(['error' => 'Invalid action']);
}
?>