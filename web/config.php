<?php
/**
 * Database Configuration
 * Update these values according to your MySQL server setup
 */

// Database credentials
define('DB_HOST', 'localhost');
define('DB_NAME', 'weather_monitor');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Timezone settings
date_default_timezone_set('Asia/Dhaka'); // Change to your timezone

// API Settings
define('API_KEY', 'your_secret_key_here'); // Optional: for securing API endpoints
define('ENABLE_API_KEY_CHECK', false); // Set to true to enable API key validation

// CORS Settings (for frontend access)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
?>