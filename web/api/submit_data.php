<?php
/**
 * API Endpoint: Submit Weather Data
 * Receives data from ESP32 via HTTP GET or POST
 * 
 * Expected parameters:
 * - temperature: float (Celsius)
 * - humidity: float (percentage)
 * - light: float (lux or percentage)
 * - pressure: float (hPa)
 * - rain: float (0-100 or 0-1)
 * - device_id: string (optional, defaults to ESP32-01)
 */

require_once '../db_connect.php';

// Validate API key if enabled
validateAPIKey();

// Set response type
header('Content-Type: application/json');

try {
    // Get database connection
    $pdo = getDBConnection();

    // Parse input data (support both GET and POST)
    $temperature = null;
    $humidity = null;
    $light = null;
    $pressure = null;
    $rain = null;
    $device_id = 'ESP32-01';

    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Handle POST request (JSON or form data)
        $contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';

        if (stripos($contentType, 'application/json') !== false) {
            // JSON payload
            $json = file_get_contents('php://input');
            $data = json_decode($json, true);
        } else {
            // Form data
            $data = $_POST;
        }

        $temperature = isset($data['temperature']) ? floatval($data['temperature']) : null;
        $humidity = isset($data['humidity']) ? floatval($data['humidity']) : null;
        $light = isset($data['light']) ? floatval($data['light']) : null;
        $pressure = isset($data['pressure']) ? floatval($data['pressure']) : null;
        $rain = isset($data['rain']) ? floatval($data['rain']) : null;
        $device_id = isset($data['device_id']) ? trim($data['device_id']) : 'ESP32-01';

    } else if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Handle GET request (URL parameters)
        $temperature = isset($_GET['temperature']) ? floatval($_GET['temperature']) : null;
        $humidity = isset($_GET['humidity']) ? floatval($_GET['humidity']) : null;
        $light = isset($_GET['light']) ? floatval($_GET['light']) : null;
        $pressure = isset($_GET['pressure']) ? floatval($_GET['pressure']) : null;
        $rain = isset($_GET['rain']) ? floatval($_GET['rain']) : null;
        $device_id = isset($_GET['device_id']) ? trim($_GET['device_id']) : 'ESP32-01';
    }

    // Validate required fields
    $errors = [];
    if ($temperature === null)
        $errors[] = 'temperature is required';
    if ($humidity === null)
        $errors[] = 'humidity is required';
    if ($light === null)
        $errors[] = 'light is required';
    if ($pressure === null)
        $errors[] = 'pressure is required';
    if ($rain === null)
        $errors[] = 'rain is required';

    if (!empty($errors)) {
        sendResponse([
            'success' => false,
            'error' => 'Missing required parameters',
            'details' => $errors
        ], 400);
    }

    // Validate data ranges (basic sanity checks)
    if ($temperature < -50 || $temperature > 100) {
        sendResponse([
            'success' => false,
            'error' => 'Invalid temperature value (must be between -50 and 100°C)'
        ], 400);
    }

    if ($humidity < 0 || $humidity > 100) {
        sendResponse([
            'success' => false,
            'error' => 'Invalid humidity value (must be between 0 and 100%)'
        ], 400);
    }

    if ($pressure < 800 || $pressure > 1200) {
        sendResponse([
            'success' => false,
            'error' => 'Invalid pressure value (must be between 800 and 1200 hPa)'
        ], 400);
    }

    // Insert data into database
    $sql = "INSERT INTO weather_data (temperature, humidity, light, pressure, rain, device_id) 
            VALUES (:temperature, :humidity, :light, :pressure, :rain, :device_id)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':temperature' => $temperature,
        ':humidity' => $humidity,
        ':light' => $light,
        ':pressure' => $pressure,
        ':rain' => $rain,
        ':device_id' => $device_id
    ]);

    $insertedId = $pdo->lastInsertId();

    // Update device last_seen
    $updateDevice = "INSERT INTO devices (device_id, last_seen) 
                     VALUES (:device_id, NOW()) 
                     ON DUPLICATE KEY UPDATE last_seen = NOW()";
    $stmt2 = $pdo->prepare($updateDevice);
    $stmt2->execute([':device_id' => $device_id]);

    // Success response
    sendResponse([
        'success' => true,
        'message' => 'Data stored successfully',
        'id' => $insertedId,
        'data' => [
            'temperature' => $temperature,
            'humidity' => $humidity,
            'light' => $light,
            'pressure' => $pressure,
            'rain' => $rain,
            'device_id' => $device_id,
            'timestamp' => date('Y-m-d H:i:s')
        ]
    ], 201);

} catch (Exception $e) {
    error_log("Error in submit_data.php: " . $e->getMessage());
    sendResponse([
        'success' => false,
        'error' => 'Failed to store data',
        'message' => $e->getMessage()
    ], 500);
}
?>