# IoT Weather Monitoring System 🌦️

A complete web-based weather monitoring system using ESP32, PHP, MySQL, and an interactive HTML/CSS/jQuery frontend. This system collects real-time weather data from ESP32 sensors and displays it with historical charts, "feels like" temperature calculations, and health suggestions.

## 📋 Features

- **Real-time Data Collection**: ESP32 sends temperature, humidity, light, pressure, and rain data via HTTP
- **MySQL Database**: Stores all historical weather data with efficient indexing
- **RESTful PHP APIs**: Secure endpoints for data submission and retrieval
- **Interactive Frontend**: Mobile-friendly web interface with:
  - Current weather display with "feels like" temperature
  - Health and safety suggestions based on weather conditions
  - Historical data visualization with Chart.js
  - Multiple time ranges (24h, 48h, 7 days, 30 days)
- **Responsive Design**: Works perfectly on desktop, tablet, and mobile devices

## 🛠️ Requirements

- PHP 7.4 or higher
- MySQL 5.7 or higher
- Apache/Nginx web server
- ESP32 with appropriate sensors (DHT22, BMP280, LDR, rain sensor)

## 📁 Project Structure

```
web/
├── api/
│   ├── submit_data.php    # ESP32 data submission endpoint
│   └── get_data.php        # Frontend data retrieval endpoint
├── config.php              # Database configuration
├── db_connect.php          # Database connection handler
├── database.sql            # MySQL database schema
├── index.html              # Main frontend page
├── styles.css              # Responsive CSS styles
├── app.js                  # jQuery application logic
```

## 🚀 Installation

### 1. Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Import database schema
mysql -u root -p < database.sql
```

Or use phpMyAdmin to import [database.sql](database.sql).

### 2. Configure Database Connection

Edit [config.php](config.php) with your database credentials:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'weather_monitor');
define('DB_USER', 'root');
define('DB_PASS', 'your_password');
```

### 3. Web Server Setup

**For Apache:**
- Place the project folder in `htdocs` or your web root
- Ensure `mod_rewrite` is enabled
- Access via `http://localhost/httpweathermonitor.work.gd/`

**For PHP Built-in Server (Development):**
```bash
cd httpweathermonitor.work.gd
php -S localhost:8000
```

### 4. ESP32 Configuration

Configure your ESP32 to send HTTP requests to:

**Using HTTP GET:**
```
http://your-server.com/api/submit_data.php?temperature=25.5&humidity=60&light=800&pressure=1013&rain=0
```

**Using HTTP POST (Recommended):**
```cpp
#include <WiFi.h>
#include <HTTPClient.h>

const char* serverUrl = "http://your-server.com/api/submit_data.php";

void sendData(float temp, float hum, float light, float pressure, float rain) {
    if(WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        http.begin(serverUrl);
        http.addHeader("Content-Type", "application/json");
        
        String jsonData = "{\"temperature\":" + String(temp) + 
                         ",\"humidity\":" + String(hum) + 
                         ",\"light\":" + String(light) + 
                         ",\"pressure\":" + String(pressure) + 
                         ",\"rain\":" + String(rain) + "}";
        
        int httpResponseCode = http.POST(jsonData);
        http.end();
    }
}
```

## 📡 API Documentation

### Submit Weather Data (ESP32)

**Endpoint:** `POST/GET /api/submit_data.php`

**Parameters:**
- `temperature` (float, required): Temperature in Celsius
- `humidity` (float, required): Humidity percentage (0-100)
- `light` (float, required): Light intensity
- `pressure` (float, required): Atmospheric pressure in hPa
- `rain` (float, required): Rain detection (0-100)
- `device_id` (string, optional): Device identifier (default: ESP32-01)

**Example Response:**
```json
{
    "success": true,
    "message": "Data stored successfully",
    "id": 123,
    "data": {
        "temperature": 25.5,
        "humidity": 60,
        "light": 800,
        "pressure": 1013.2,
        "rain": 0,
        "device_id": "ESP32-01",
        "timestamp": "2026-01-03 14:30:00"
    }
}
```

### Get Weather Data (Frontend)

**Endpoint:** `GET /api/get_data.php`

**Modes:**

1. **Current Data**
   ```
   GET /api/get_data.php?mode=current
   ```

2. **Recent Readings**
   ```
   GET /api/get_data.php?mode=recent&limit=50
   ```

3. **Hourly Averages**
   ```
   GET /api/get_data.php?mode=hourly&hours=24
   ```

4. **Daily Statistics**
   ```
   GET /api/get_data.php?mode=daily&days=7
   ```

5. **Date Range**
   ```
   GET /api/get_data.php?mode=range&start=2026-01-01&end=2026-01-03
   ```

6. **Statistics**
   ```
   GET /api/get_data.php?mode=stats
   ```

## 🎨 Frontend Features

### Current Weather Display
- Real-time temperature with "feels like" calculation using Heat Index formula
- Humidity levels with comfort status
- Light intensity with brightness levels
- Atmospheric pressure with weather prediction
- Rain detection with status indicators
- Last update timestamp

### Health Suggestions
Intelligent health recommendations based on:
- Temperature extremes (heat warnings, cold alerts)
- Humidity levels (comfort, health risks)
- Combined heat index (dangerous conditions)
- Atmospheric pressure (weather-sensitive health conditions)
- Rain detection (safety precautions)

### Historical Data Visualization
- Interactive charts using Chart.js
- Temperature and humidity trends
- Pressure and light patterns
- Rain detection history
- Multiple time ranges: 24h, 48h, 7 days, 30 days

### Mobile Responsive
- Optimized for all screen sizes
- Touch-friendly interface
- Adaptive layouts for phones, tablets, and desktops

## 🔒 Security (Optional)

To enable API key authentication, edit [config.php](config.php):

```php
define('API_KEY', 'your_secret_key_here');
define('ENABLE_API_KEY_CHECK', true);
```

Then include the API key in requests:
```
GET /api/submit_data.php?api_key=your_secret_key_here&temperature=25...
```

Or as header:
```
X-API-Key: your_secret_key_here
```

## 📊 Database Schema

### Tables

**weather_data**
- `id`: Auto-increment primary key
- `temperature`: Temperature in Celsius
- `humidity`: Humidity percentage
- `light`: Light intensity
- `pressure`: Atmospheric pressure in hPa
- `rain`: Rain detection value
- `timestamp`: Automatic timestamp
- `device_id`: ESP32 device identifier

**devices**
- `id`: Auto-increment primary key
- `device_id`: Unique device identifier
- `device_name`: Friendly device name
- `location`: Physical location
- `last_seen`: Last data submission
- `is_active`: Device status
- `created_at`: Registration timestamp

### Views

- `latest_weather`: Most recent reading
- `hourly_averages`: Hourly aggregated data
- `daily_statistics`: Daily min/max/avg statistics

## 🔧 Troubleshooting

### Database Connection Error
- Verify MySQL is running
- Check credentials in [config.php](config.php)
- Ensure database `weather_monitor` exists

### ESP32 Can't Connect
- Verify server URL is correct
- Check network connectivity
- Ensure firewall allows incoming connections
- Test API with browser or Postman

### Charts Not Loading
- Check browser console for JavaScript errors
- Verify Chart.js CDN is accessible
- Ensure data exists in database

### No Data Displayed
- Check if ESP32 is sending data (check MySQL table)
- Verify API endpoints return valid JSON
- Check browser console for AJAX errors

## 🎯 Future Enhancements

- [ ] User authentication and multi-user support
- [ ] Email/SMS alerts for extreme weather conditions
- [ ] Weather forecast integration
- [ ] Data export (CSV, JSON)
- [ ] Admin dashboard for device management
- [ ] PWA support for offline functionality
- [ ] WebSocket support for real-time updates

## 📝 License

This project is open-source and available for educational and personal use.

## 👨‍💻 Author

Created for IoT Weather Monitoring Project - January 2026

## 🤝 Contributing

Feel free to fork, improve, and submit pull requests!

## 📞 Support

For issues or questions, please check:
1. Database connection in [config.php](config.php)
2. PHP error logs
3. Browser console for frontend errors
4. ESP32 serial monitor for debugging

---

**Happy Monitoring! 🌤️**
