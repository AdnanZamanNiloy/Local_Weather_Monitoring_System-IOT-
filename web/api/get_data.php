<?php
/**
 * API Endpoint: Get Weather Data
 * Retrieves weather data for frontend display
 * 
 * Endpoints:
 * - ?mode=current : Get latest reading
 * - ?mode=recent&limit=50 : Get recent readings (default 50)
 * - ?mode=hourly&hours=24 : Get hourly averages (default 24 hours)
 * - ?mode=daily&days=7 : Get daily statistics (default 7 days)
 * - ?mode=range&start=YYYY-MM-DD&end=YYYY-MM-DD : Get data for date range
 * - ?mode=stats : Get overall statistics
 */

require_once '../db_connect.php';

// Set response type
header('Content-Type: application/json');

try {
    $pdo = getDBConnection();

    $mode = isset($_GET['mode']) ? $_GET['mode'] : 'current';

    switch ($mode) {
        case 'current':
            // Get the most recent reading
            $sql = "SELECT * FROM weather_data ORDER BY timestamp DESC LIMIT 1";
            $stmt = $pdo->query($sql);
            $data = $stmt->fetch();

            if ($data) {
                sendResponse([
                    'success' => true,
                    'mode' => 'current',
                    'data' => $data
                ]);
            } else {
                sendResponse([
                    'success' => false,
                    'error' => 'No data available'
                ], 404);
            }
            break;

        case 'recent':
            // Get recent readings
            $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50;
            $limit = min($limit, 1000); // Max 1000 records

            $sql = "SELECT * FROM weather_data ORDER BY timestamp DESC LIMIT :limit";
            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            $data = $stmt->fetchAll();

            sendResponse([
                'success' => true,
                'mode' => 'recent',
                'count' => count($data),
                'data' => $data
            ]);
            break;

        case 'hourly':
            // Get hourly averages
            $hours = isset($_GET['hours']) ? intval($_GET['hours']) : 24;
            $hours = min($hours, 168); // Max 1 week

            $sql = "SELECT 
                        DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00') as hour,
                        AVG(temperature) as avg_temp,
                        MIN(temperature) as min_temp,
                        MAX(temperature) as max_temp,
                        AVG(humidity) as avg_humidity,
                        AVG(light) as avg_light,
                        AVG(pressure) as avg_pressure,
                        AVG(rain) as avg_rain,
                        COUNT(*) as reading_count
                    FROM weather_data
                    WHERE timestamp >= DATE_SUB(NOW(), INTERVAL :hours HOUR)
                    GROUP BY DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00')
                    ORDER BY hour DESC";

            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':hours', $hours, PDO::PARAM_INT);
            $stmt->execute();
            $data = $stmt->fetchAll();

            sendResponse([
                'success' => true,
                'mode' => 'hourly',
                'hours' => $hours,
                'count' => count($data),
                'data' => $data
            ]);
            break;

        case 'daily':
            // Get daily statistics
            $days = isset($_GET['days']) ? intval($_GET['days']) : 7;
            $days = min($days, 365); // Max 1 year

            $sql = "SELECT 
                        DATE(timestamp) as date,
                        MIN(temperature) as min_temp,
                        MAX(temperature) as max_temp,
                        AVG(temperature) as avg_temp,
                        MIN(humidity) as min_humidity,
                        MAX(humidity) as max_humidity,
                        AVG(humidity) as avg_humidity,
                        AVG(light) as avg_light,
                        AVG(pressure) as avg_pressure,
                        SUM(rain) as total_rain,
                        COUNT(*) as reading_count
                    FROM weather_data
                    WHERE timestamp >= DATE_SUB(CURDATE(), INTERVAL :days DAY)
                    GROUP BY DATE(timestamp)
                    ORDER BY date DESC";

            $stmt = $pdo->prepare($sql);
            $stmt->bindValue(':days', $days, PDO::PARAM_INT);
            $stmt->execute();
            $data = $stmt->fetchAll();

            sendResponse([
                'success' => true,
                'mode' => 'daily',
                'days' => $days,
                'count' => count($data),
                'data' => $data
            ]);
            break;

        case 'range':
            // Get data for specific date range
            $start = isset($_GET['start']) ? $_GET['start'] : date('Y-m-d', strtotime('-7 days'));
            $end = isset($_GET['end']) ? $_GET['end'] : date('Y-m-d');

            $sql = "SELECT * FROM weather_data 
                    WHERE DATE(timestamp) BETWEEN :start AND :end
                    ORDER BY timestamp DESC";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([':start' => $start, ':end' => $end]);
            $data = $stmt->fetchAll();

            sendResponse([
                'success' => true,
                'mode' => 'range',
                'start' => $start,
                'end' => $end,
                'count' => count($data),
                'data' => $data
            ]);
            break;

        case 'stats':
            // Get overall statistics
            $sql = "SELECT 
                        COUNT(*) as total_readings,
                        MIN(temperature) as all_time_min_temp,
                        MAX(temperature) as all_time_max_temp,
                        AVG(temperature) as avg_temp,
                        MIN(humidity) as min_humidity,
                        MAX(humidity) as max_humidity,
                        AVG(humidity) as avg_humidity,
                        AVG(light) as avg_light,
                        AVG(pressure) as avg_pressure,
                        MIN(timestamp) as first_reading,
                        MAX(timestamp) as last_reading
                    FROM weather_data";

            $stmt = $pdo->query($sql);
            $stats = $stmt->fetch();

            // Get today's stats
            $sqlToday = "SELECT 
                            COUNT(*) as today_readings,
                            MIN(temperature) as today_min_temp,
                            MAX(temperature) as today_max_temp,
                            AVG(temperature) as today_avg_temp
                         FROM weather_data
                         WHERE DATE(timestamp) = CURDATE()";

            $stmtToday = $pdo->query($sqlToday);
            $todayStats = $stmtToday->fetch();

            sendResponse([
                'success' => true,
                'mode' => 'stats',
                'overall' => $stats,
                'today' => $todayStats
            ]);
            break;

        default:
            sendResponse([
                'success' => false,
                'error' => 'Invalid mode',
                'available_modes' => ['current', 'recent', 'hourly', 'daily', 'range', 'stats']
            ], 400);
    }

} catch (Exception $e) {
    error_log("Error in get_data.php: " . $e->getMessage());
    sendResponse([
        'success' => false,
        'error' => 'Failed to retrieve data',
        'message' => $e->getMessage()
    ], 500);
}
?>