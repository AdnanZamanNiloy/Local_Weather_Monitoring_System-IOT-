<?php
/**
 * Database Connection Handler
 * Uses PDO for secure database operations
 */

require_once 'config.php';

function getDBConnection()
{
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];

        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;

    } catch (PDOException $e) {
        error_log("Database Connection Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'Database connection failed'
        ]);
        exit();
    }
}

/**
 * Validate API Key (optional security)
 */
function validateAPIKey()
{
    if (!ENABLE_API_KEY_CHECK) {
        return true;
    }

    $headers = getallheaders();
    $apiKey = isset($headers['X-API-Key']) ? $headers['X-API-Key'] :
        (isset($_GET['api_key']) ? $_GET['api_key'] : '');

    if ($apiKey !== API_KEY) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Invalid API key'
        ]);
        exit();
    }
    return true;
}

/**
 * Send JSON response
 */
function sendResponse($data, $statusCode = 200)
{
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit();
}
?>