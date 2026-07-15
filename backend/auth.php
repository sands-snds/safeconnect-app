<?php
require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ========================================
// SIGN UP
// ========================================
if ($method === 'POST' && $action === 'signup') {
    $data = json_decode(file_get_contents('php://input'), true);

    $fullName = trim($data['fullName'] ?? '');
    $username = trim($data['username'] ?? '');
    $contact  = trim($data['contact'] ?? '');
    $email    = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';

    if (empty($fullName) || empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'All fields are required']);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid email address']);
        exit;
    }

    try {
        // Check if email already exists
        $stmt = $pdo->prepare("SELECT id FROM registered_users WHERE email_address = ?");
        $stmt->execute([$email]);
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'An account with this email already exists']);
            exit;
        }

        // Check if username already exists (only if one was provided)
        if (!empty($username)) {
            $stmt = $pdo->prepare("SELECT id FROM registered_users WHERE username = ?");
            $stmt->execute([$username]);
            if ($stmt->fetch()) {
                echo json_encode(['success' => false, 'message' => 'This username is already taken']);
                exit;
            }
        }

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        $stmt = $pdo->prepare("
            INSERT INTO registered_users (full_name, username, contact_number, email_address, password) 
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $fullName,
            $username ?: null,
            $contact ?: null,
            $email,
            $hashedPassword
        ]);

        echo json_encode(['success' => true, 'message' => 'Account created successfully']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Registration failed: ' . $e->getMessage()]);
    }
    exit;
}

// ========================================
// SIGN IN
// ========================================
else if ($method === 'POST' && $action === 'signin') {
    $data = json_decode(file_get_contents('php://input'), true);

    $email    = trim($data['email'] ?? '');
    $password = $data['password'] ?? '';

    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Email and password are required']);
        exit;
    }

    try {
        // Hardcoded admin account
        if (strtolower($email) === 'admin@safeconnect.org' && $password === 'admin123') {
            $stmt = $pdo->prepare("INSERT INTO admin_logs (email_address) VALUES (?)");
            $stmt->execute([$email]);

            echo json_encode([
                'success' => true,
                'isAdmin' => true,
                'message' => 'Admin login successful'
            ]);
            exit;
        }

        // Regular user
        $stmt = $pdo->prepare("SELECT * FROM registered_users WHERE email_address = ?");
        $stmt->execute([$email]);
        $userRecord = $stmt->fetch();

        if ($userRecord && password_verify($password, $userRecord['password'])) {
            $stmt = $pdo->prepare("INSERT INTO signin_logs (full_name, email_address, status) VALUES (?, ?, 'Success')");
            $stmt->execute([$userRecord['full_name'], $email]);

            echo json_encode([
                'success' => true,
                'isAdmin' => false,
                'user' => [
                    'id' => $userRecord['id'],
                    'fullName' => $userRecord['full_name'],
                    'username' => $userRecord['username'],
                    'contact' => $userRecord['contact_number'],
                    'email' => $userRecord['email_address']
                ],
                'message' => 'Login successful'
            ]);
        } else {
            $stmt = $pdo->prepare("INSERT INTO signin_logs (full_name, email_address, status) VALUES ('Unknown User', ?, 'Failed')");
            $stmt->execute([$email]);

            echo json_encode(['success' => false, 'message' => 'Invalid email or password']);
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Login failed: ' . $e->getMessage()]);
    }
    exit;
}

// ========================================
// GET ALL USERS (admin dashboard)
// ========================================
else if ($method === 'GET' && $action === 'users') {
    $stmt = $pdo->query("
        SELECT id, full_name, username, contact_number, email_address, status, created_at 
        FROM registered_users ORDER BY id DESC
    ");
    echo json_encode($stmt->fetchAll());
    exit;
}

// ========================================
// UPDATE USER STATUS (Active/Inactive/Suspended)
// ========================================
else if ($method === 'POST' && $action === 'update-status') {
    $data = json_decode(file_get_contents('php://input'), true);

    $stmt = $pdo->prepare("UPDATE registered_users SET status = ? WHERE id = ?");
    if ($stmt->execute([$data['status'], $data['id']])) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false]);
    }
    exit;
}

else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid action']);
}
