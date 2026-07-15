<?php

error_reporting(E_ALL);
ini_set('display_errors', '0');
ini_set('log_errors', '1');

header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';
require_once 'link_scraper.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

define('UPLOAD_DIR', __DIR__ . '/uploads/announcements/');
define('UPLOAD_URL_PREFIX', 'uploads/announcements/');
// BASE_URL is already defined in config.php — defining it again here caused
// a PHP warning on every request, which broke the JSON response (this was the
// "Unexpected token '<'" error).

function build_image_url($path) {
    if (!$path) return null;
    return rtrim(BASE_URL, '/') . '/' . ltrim($path, '/');
}

// CREATE Announcement
// CREATE Announcement
if ($method === 'POST' && $action === 'create') {

    $isMultipart = !empty($_POST) || !empty($_FILES);

    if ($isMultipart) {
        $title     = trim($_POST['title'] ?? '');
        $category  = trim($_POST['category'] ?? '');
        $message   = trim($_POST['message'] ?? '');
        $date      = $_POST['date'] ?? date('Y-m-d');
        $sourceUrl = trim($_POST['source_url'] ?? '');
    } else {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $title     = trim($data['title'] ?? '');
        $category  = trim($data['category'] ?? '');
        $message   = trim($data['message'] ?? '');
        $date      = $data['date'] ?? date('Y-m-d');
        $sourceUrl = trim($data['source_url'] ?? '');
    }

    if ($title === '' || $category === '' || $message === '') {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Title, category and message are required."
        ]);
        exit;
    }

    $imagePath = null;

    if (!empty($_FILES['image']['name'])) {

        $file = $_FILES['image'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Image upload failed."
            ]);
            exit;
        }

        $mime = mime_content_type($file['tmp_name']);

        if ($mime !== 'image/jpeg') {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Only JPEG images are allowed."
            ]);
            exit;
        }

        if (!is_dir(UPLOAD_DIR)) {
            mkdir(UPLOAD_DIR, 0755, true);
        }

        $filename = "ann_" . time() . "_" . uniqid() . ".jpg";

        if (!move_uploaded_file($file['tmp_name'], UPLOAD_DIR . $filename)) {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Failed to save uploaded image."
            ]);
            exit;
        }

        $imagePath = UPLOAD_URL_PREFIX . $filename;
    }

    $sourceTitle = null;
    $sourceImage = null;
    $sourceSite  = null;

    if (!empty($sourceUrl)) {

        $preview = fetch_article_preview($sourceUrl);

        if ($preview) {
            $sourceTitle = $preview['title'] ?? null;
            $sourceImage = $preview['image'] ?? null;
            $sourceSite  = $preview['site'] ?? null;
        }
    }

    try {

        $stmt = $pdo->prepare("
            INSERT INTO announcements
            (
                title,
                category,
                message,
                date_posted,
                image_path,
                source_url,
                source_title,
                source_image,
                source_site
            )
            VALUES
            (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $title,
            $category,
            $message,
            $date,
            $imagePath,
            $sourceUrl ?: null,
            $sourceTitle,
            $sourceImage,
            $sourceSite
        ]);

        echo json_encode([
            "success" => true,
            "id" => $pdo->lastInsertId()
        ]);

    } catch (PDOException $e) {

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "message" => $e->getMessage()
        ]);
    }

}

// UPDATE Announcement
else if ($method === 'POST' && $action === 'update') {

    $isMultipart = !empty($_POST) || !empty($_FILES);

    if ($isMultipart) {
        $id          = $_POST['id'] ?? null;
        $title       = trim($_POST['title'] ?? '');
        $category    = trim($_POST['category'] ?? '');
        $message     = trim($_POST['message'] ?? '');
        $date        = $_POST['date'] ?? date('Y-m-d');
        $sourceUrl   = trim($_POST['source_url'] ?? '');
        $removeImage = !empty($_POST['remove_image']);
    } else {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        $id          = $data['id'] ?? null;
        $title       = trim($data['title'] ?? '');
        $category    = trim($data['category'] ?? '');
        $message     = trim($data['message'] ?? '');
        $date        = $data['date'] ?? date('Y-m-d');
        $sourceUrl   = trim($data['source_url'] ?? '');
        $removeImage = !empty($data['remove_image']);
    }

    if (!$id) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Missing announcement id."
        ]);
        exit;
    }

    if ($title === '' || $category === '' || $message === '') {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "message" => "Title, category and message are required."
        ]);
        exit;
    }

    // Look up the existing row so we know what image (if any) is already
    // on disk, and can tell the row actually exists before updating it.
    $stmt = $pdo->prepare("SELECT image_path FROM announcements WHERE id = ?");
    $stmt->execute([$id]);
    $existing = $stmt->fetch();

    if (!$existing) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "message" => "Announcement not found."
        ]);
        exit;
    }

    $imagePath = $existing['image_path'];

    if (!empty($_FILES['image']['name'])) {

        // A new image was chosen - upload it and replace whatever was there before.
        $file = $_FILES['image'];

        if ($file['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Image upload failed."
            ]);
            exit;
        }

        $mime = mime_content_type($file['tmp_name']);

        if ($mime !== 'image/jpeg') {
            http_response_code(400);
            echo json_encode([
                "success" => false,
                "message" => "Only JPEG images are allowed."
            ]);
            exit;
        }

        if (!is_dir(UPLOAD_DIR)) {
            mkdir(UPLOAD_DIR, 0755, true);
        }

        $filename = "ann_" . time() . "_" . uniqid() . ".jpg";

        if (!move_uploaded_file($file['tmp_name'], UPLOAD_DIR . $filename)) {
            http_response_code(500);
            echo json_encode([
                "success" => false,
                "message" => "Failed to save uploaded image."
            ]);
            exit;
        }

        if ($imagePath) {
            $oldFilePath = __DIR__ . '/' . $imagePath;
            if (is_file($oldFilePath)) {
                unlink($oldFilePath);
            }
        }

        $imagePath = UPLOAD_URL_PREFIX . $filename;

    } elseif ($removeImage && $imagePath) {

        // No new image, but the user explicitly cleared the old one.
        $oldFilePath = __DIR__ . '/' . $imagePath;
        if (is_file($oldFilePath)) {
            unlink($oldFilePath);
        }
        $imagePath = null;
    }

    $sourceTitle = null;
    $sourceImage = null;
    $sourceSite  = null;

    if (!empty($sourceUrl)) {

        $preview = fetch_article_preview($sourceUrl);

        if ($preview) {
            $sourceTitle = $preview['title'] ?? null;
            $sourceImage = $preview['image'] ?? null;
            $sourceSite  = $preview['site'] ?? null;
        }
    }

    try {

        $stmt = $pdo->prepare("
            UPDATE announcements
            SET
                title = ?,
                category = ?,
                message = ?,
                date_posted = ?,
                image_path = ?,
                source_url = ?,
                source_title = ?,
                source_image = ?,
                source_site = ?
            WHERE id = ?
        ");

        $stmt->execute([
            $title,
            $category,
            $message,
            $date,
            $imagePath,
            $sourceUrl ?: null,
            $sourceTitle,
            $sourceImage,
            $sourceSite,
            $id
        ]);

        echo json_encode([
            "success" => true
        ]);

    } catch (PDOException $e) {

        http_response_code(500);

        echo json_encode([
            "success" => false,
            "message" => $e->getMessage()
        ]);
    }

}

// GET All Announcements
else if ($method === 'GET' && $action === 'list') {
    $stmt = $pdo->query("SELECT * FROM announcements ORDER BY id DESC");
    $rows = $stmt->fetchAll();

    $result = array_map(function ($row) {
        $row['image_path'] = build_image_url($row['image_path'] ?? null);
        return $row;
    }, $rows);

    echo json_encode($result);
}

// GET Link Preview (used by the admin form's live preview, before saving)
else if ($method === 'GET' && $action === 'link-preview') {
    $url = $_GET['url'] ?? '';
    if (!$url) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing url parameter']);
        exit;
    }

    $preview = fetch_article_preview($url);
    if (!$preview) {
        http_response_code(422);
        echo json_encode(['success' => false, 'message' => 'Could not read that link. Double-check the URL.']);
        exit;
    }

    echo json_encode($preview);
}

// DELETE Announcement
else if ($method === 'DELETE' && $action === 'delete') {
    $id = $_GET['id'] ?? null;

    if (!$id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing id']);
        exit;
    }

    // Clean up the uploaded file on disk too, if there was one.
    $stmt = $pdo->prepare("SELECT image_path FROM announcements WHERE id = ?");
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if ($row && $row['image_path']) {
        $filePath = __DIR__ . '/' . $row['image_path'];
        if (is_file($filePath)) {
            unlink($filePath);
        }
    }

    $stmt = $pdo->prepare("DELETE FROM announcements WHERE id = ?");
    if ($stmt->execute([$id])) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false]);
    }
}

else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid action']);
}