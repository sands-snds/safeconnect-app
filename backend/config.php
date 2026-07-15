<?php
// ========================================
// CONFIG - DATABASE CONNECTION + CORS
// ========================================

header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit(0);
}

$host = 'localhost';
$db   = 'safeconnect_db';
$user = 'root';
$pass = ''; // Default XAMPP password is empty

// Public base URL of the folder these .php files live in (no trailing slash).
// Used to turn stored image paths like "uploads/announcements/xyz.jpg" into
// full URLs the React app can display. Update this to match your htdocs path.
if (!defined('BASE_URL')) {
    define('BASE_URL', 'http://localhost/safeconnect-app/backend');
}

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
    exit;
}