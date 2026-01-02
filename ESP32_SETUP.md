# ESP32 Setup Guide

## 📋 Required Libraries

Install these libraries via Arduino IDE Library Manager:

1. **DHT sensor library** by Adafruit (v1.4.4+)
2. **Adafruit BMP280 Library** (v2.6.6+)
3. **Adafruit Unified Sensor** (v1.1.9+)
4. **LiquidCrystal I2C** by Frank de Brabander (v1.1.2+)
5. **ArduinoJson** by Benoit Blanchon (v6.21.0+)

ESP32 board support comes with WiFi and HTTPClient built-in.

## 🔧 Hardware Connections

| Sensor/Module | ESP32 Pin | Notes |
|--------------|-----------|-------|
| DHT11 Data | GPIO 5 | Temperature & Humidity |
| BMP280 SDA | GPIO 21 | I2C Data |
| BMP280 SCL | GPIO 22 | I2C Clock |
| Rain Sensor | GPIO 25 | Digital Input |
| LDR (Light) | GPIO 34 | Analog Input (0-3.3V) |
| LCD SDA | GPIO 21 | I2C Data (shared with BMP280) |
| LCD SCL | GPIO 22 | I2C Clock (shared with BMP280) |

### I2C Addresses:
- **BMP280**: 0x76 (or 0x77 if SDO pulled high)
- **LCD**: 0x27 (common for PCF8574 backpack)

## ⚙️ Configuration

### 1. Update WiFi Credentials
```cpp
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";
```

### 2. Server Domain
Already configured to: `weathermonitor.work.gd`

The ESP32 will POST data to:
- `http://weathermonitor.work.gd/api/submit_data.php`

And can optionally fetch from:
- `http://weathermonitor.work.gd/api/get_data.php?mode=current`

### 3. Timing Configuration
```cpp
unsigned long sensorInterval = 2000;      // Read sensors every 2 seconds
unsigned long serverInterval = 30000;     // Post to server every 30 seconds
```

Adjust these values as needed:
- **sensorInterval**: How often to read sensors (ms)
- **serverInterval**: How often to send data to server (ms)

## 📤 Data Format

ESP32 sends JSON data:
```json
{
  "temperature": 28.5,
  "humidity": 65.0,
  "light": 75,
  "pressure": 1013.2,
  "rain": 0,
  "device_id": "ESP32-01"
}
```

Rain values:
- `0` = No rain
- `100` = Rain detected

## 📺 LCD Display Pages

The LCD cycles through 3 pages every 2 seconds:

**Page 1:** Temperature, Humidity, Pressure
```
T:28.5C H:65%
P:1013 hPa
```

**Page 2:** Light and Rain Status
```
Light:75%
Rain:NO
```

**Page 3:** Server Connection Status
```
Server: OK
weathermonitor
```

## 🔍 Serial Monitor Output

Open Serial Monitor at **115200 baud** to see:
- WiFi connection status
- Sensor readings
- Server POST requests and responses
- Error messages

Example output:
```
=== ESP32 Weather Station ===
Server: weathermonitor.work.gd
Connecting to WiFi........
WiFi Connected!
IP Address: 192.168.1.100

Sensors Read:
  Temp: 28.5°C | Humidity: 65.0% | Pressure: 1013.2 hPa
  Light: 75% | Rain: NO

Posting to server...
{"temperature":28.5,"humidity":65.0,"light":75,"pressure":1013.2,"rain":0,"device_id":"ESP32-01"}
Response Code: 201
Response: {"success":true,"message":"Data stored successfully",...}
```

## 🚀 Upload & Run

1. **Connect ESP32** via USB
2. **Select Board**: Tools → Board → ESP32 Dev Module
3. **Select Port**: Tools → Port → (your COM port)
4. **Upload**: Click Upload button
5. **Open Serial Monitor**: Tools → Serial Monitor (115200 baud)

## 🐛 Troubleshooting

### WiFi Won't Connect
- Check SSID and password
- Ensure 2.4GHz WiFi (ESP32 doesn't support 5GHz)
- Check signal strength

### Server POST Fails
- Verify server is accessible: `http://weathermonitor.work.gd/api/submit_data.php`
- Check firewall settings
- Ensure PHP server is running
- Check Serial Monitor for error codes

### BMP280 Error
- Check I2C wiring (SDA/SCL)
- Verify I2C address (try 0x77 if 0x76 fails)
- Check power supply (3.3V)

### DHT11 Returns NaN
- Check data pin connection
- Ensure proper power supply
- Wait 2-3 seconds after power-on

### LCD Not Displaying
- Check I2C address (common: 0x27, 0x3F)
- Verify I2C wiring
- Adjust contrast potentiometer on LCD backpack
- Use I2C scanner sketch to find address

## 📊 Features

✅ **Automatic Data Posting**: Sends data every 30 seconds  
✅ **WiFi Reconnection**: Auto-reconnects if connection drops  
✅ **Offline Operation**: Continues sensor reading if WiFi fails  
✅ **LCD Display**: Local data monitoring  
✅ **Serial Debugging**: Detailed logging  
✅ **JSON Format**: Compatible with PHP API  
✅ **Error Handling**: Graceful failure management  

## 🔄 Data Flow

```
┌─────────────┐
│   Sensors   │
│ DHT11/BMP280│
│  LDR/Rain   │
└──────┬──────┘
       │ Read every 2s
       ▼
┌─────────────┐
│   ESP32     │
│  Processing │
└──────┬──────┘
       │ POST every 30s
       ▼
┌─────────────┐
│ weathermon- │
│ itor.work.gd│
│  PHP Server │
└──────┬──────┘
       │ Store in MySQL
       ▼
┌─────────────┐
│   Database  │
│    MySQL    │
└─────────────┘
```

## 🎯 Next Steps

1. Upload code to ESP32
2. Monitor Serial output
3. Verify data appears in MySQL database
4. Check frontend at: `http://weathermonitor.work.gd/`
5. Adjust timing intervals as needed

---

**Server Status**: Check at `http://weathermonitor.work.gd/api/get_data.php?mode=current`
