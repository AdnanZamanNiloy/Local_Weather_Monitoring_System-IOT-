-- Weather Monitoring System Database Schema
-- Created: January 2026

-- Create database
-- CREATE DATABASE IF NOT EXISTS weather_monitor;
-- USE weather_monitor;

-- Weather data table to store sensor readings
CREATE TABLE IF NOT EXISTS weather_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    temperature FLOAT NOT NULL COMMENT 'Temperature in Celsius',
    humidity FLOAT NOT NULL COMMENT 'Humidity percentage',
    light FLOAT NOT NULL COMMENT 'Light intensity (lux or percentage)',
    pressure FLOAT NOT NULL COMMENT 'Atmospheric pressure in hPa',
    rain FLOAT NOT NULL COMMENT 'Rain detection (0-100% or 0-1)',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    device_id VARCHAR(50) DEFAULT 'ESP32-01' COMMENT 'ESP32 device identifier',
    INDEX idx_timestamp (timestamp),
    INDEX idx_device (device_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Device registration table (optional, for multiple devices)
CREATE TABLE IF NOT EXISTS devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id VARCHAR(50) UNIQUE NOT NULL,
    device_name VARCHAR(100),
    location VARCHAR(200),
    last_seen DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default device
INSERT INTO devices (device_id, device_name, location) 
VALUES ('ESP32-01', 'Weather Station 1', 'Default Location')
ON DUPLICATE KEY UPDATE device_name = device_name;

-- Create view for latest readings
CREATE OR REPLACE VIEW latest_weather AS
SELECT * FROM weather_data
ORDER BY timestamp DESC
LIMIT 1;

-- Create view for hourly averages
CREATE OR REPLACE VIEW hourly_averages AS
SELECT 
    DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00') as hour,
    AVG(temperature) as avg_temp,
    AVG(humidity) as avg_humidity,
    AVG(light) as avg_light,
    AVG(pressure) as avg_pressure,
    AVG(rain) as avg_rain,
    COUNT(*) as reading_count
FROM weather_data
GROUP BY DATE_FORMAT(timestamp, '%Y-%m-%d %H:00:00')
ORDER BY hour DESC;

-- Create view for daily statistics
CREATE OR REPLACE VIEW daily_statistics AS
SELECT 
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
GROUP BY DATE(timestamp)
ORDER BY date DESC;
