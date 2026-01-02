#include "DHT.h"
#include <Adafruit_BMP280.h>
#include <Adafruit_Sensor.h>
#include <ArduinoJson.h>
#include <HTTPClient.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <Wire.h>

// ================= CONFIG =================
#define SEALEVELPRESSURE_HPA 1013.25

#define DHTPIN 5
#define DHTTYPE DHT11
#define RAIN_PIN 25
#define LDR_PIN 34

// ================= SERVER CONFIG =================
const char* serverDomain = "weathermonitor.work.gd";
const char* submitEndpoint = "https://weathermonitor.work.gd/api/submit_data.php";
const char* fetchEndpoint = "https://weathermonitor.work.gd/api/get_data.php?mode=current";

// ================= OBJECTS =================
LiquidCrystal_I2C lcd(0x27, 16, 2);
Adafruit_BMP280 bmp;
DHT dht(DHTPIN, DHTTYPE);

// ================= WIFI =================
const char* ssid = "MM-227";
const char* password = "Galib@cse";

// ================= VARIABLES =================
float temperature, pressure;
float humidity;
int rainStatus;
int ldrValue;
int lightPercent;

unsigned long lastSensorRead = 0;
unsigned long lastServerPost = 0;
unsigned long sensorInterval = 2000; // Read sensors every 2 seconds
unsigned long serverInterval = 30000; // Post to server every 30 seconds

int lcdPage = 0;
bool dataPostedSuccessfully = false;

// ================= FUNCTIONS =================
void readSensors()
{
    temperature = bmp.readTemperature();
    pressure = bmp.readPressure() / 100.0F;

    humidity = dht.readHumidity();
    if (isnan(humidity))
        humidity = 0;

    rainStatus = digitalRead(RAIN_PIN);

    // LDR Reading (0-4095 -> 0-100%)
    ldrValue = analogRead(LDR_PIN);
    lightPercent = 100 - (ldrValue * 100) / 4095;

    Serial.println("Sensors Read:");
    Serial.printf("  Temp: %.1f°C | Humidity: %.1f%% | Pressure: %.1f hPa\n",
        temperature, humidity, pressure);
    Serial.printf("  Light: %d%% | Rain: %s\n",
        lightPercent, (rainStatus == LOW ? "YES" : "NO"));
}

bool postDataToServer()
{
    if (WiFi.status() != WL_CONNECTED) {
        Serial.println("WiFi not connected!");
        return false;
    }

    HTTPClient http;
    http.begin(submitEndpoint);
    http.addHeader("Content-Type", "application/json");

    // Create JSON payload
    StaticJsonDocument<256> doc;
    doc["temperature"] = temperature;
    doc["humidity"] = humidity;
    doc["light"] = lightPercent;
    doc["pressure"] = pressure;
    doc["rain"] = (rainStatus == LOW ? 100 : 0); // 100 = raining, 0 = no rain
    doc["device_id"] = "ESP32-01";

    String jsonData;
    serializeJson(doc, jsonData);

    Serial.println("Posting to server...");
    Serial.println(jsonData);

    int httpResponseCode = http.POST(jsonData);

    if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.printf("Response Code: %d\n", httpResponseCode);
        Serial.println("Response: " + response);
        http.end();
        return (httpResponseCode == 201 || httpResponseCode == 200);
    } else {
        Serial.printf("Error: %s\n", http.errorToString(httpResponseCode).c_str());
        http.end();
        return false;
    }
}

void fetchDataFromServer()
{
    if (WiFi.status() != WL_CONNECTED) {
        return;
    }

    HTTPClient http;
    http.begin(fetchEndpoint);

    int httpResponseCode = http.GET();

    if (httpResponseCode == 200) {
        String response = http.getString();

        // Parse JSON response (optional - for display purposes)
        StaticJsonDocument<512> doc;
        DeserializationError error = deserializeJson(doc, response);

        if (!error && doc["success"]) {
            Serial.println("Latest data from server:");
            Serial.printf("  Temp: %.1f°C | Humidity: %.1f%%\n",
                doc["data"]["temperature"].as<float>(),
                doc["data"]["humidity"].as<float>());
        }
    }

    http.end();
}

void updateLCD()
{
    lcd.clear();

    if (lcdPage == 0) {
        lcd.setCursor(0, 0);
        lcd.print("T:");
        lcd.print(temperature, 1);
        lcd.print("C H:");
        lcd.print(humidity, 0);
        lcd.print("%");

        lcd.setCursor(0, 1);
        lcd.print("P:");
        lcd.print(pressure, 0);
        lcd.print(" hPa");
    } else if (lcdPage == 1) {
        lcd.setCursor(0, 0);
        lcd.print("Light:");
        lcd.print(lightPercent);
        lcd.print("%");

        lcd.setCursor(0, 1);
        lcd.print("Rain:");
        lcd.print(rainStatus == LOW ? "YES" : "NO");
    } else if (lcdPage == 2) {
        lcd.setCursor(0, 0);
        if (WiFi.status() == WL_CONNECTED) {
            lcd.print("Server: ");
            lcd.print(dataPostedSuccessfully ? "OK" : "ERR");
        } else {
            lcd.print("WiFi: OFFLINE");
        }

        lcd.setCursor(0, 1);
        lcd.print("weathermonitor");
    }

    lcdPage++;
    if (lcdPage > 2)
        lcdPage = 0;
}

// ================= SETUP =================
void setup()
{
    Serial.begin(115200);

    // ESP32 ADC Configuration
    analogReadResolution(12);
    analogSetPinAttenuation(LDR_PIN, ADC_11db);

    // LCD Initialization
    lcd.init();
    lcd.backlight();
    lcd.setCursor(0, 0);
    lcd.print("Weather Station");
    lcd.setCursor(0, 1);
    lcd.print("Starting...");
    delay(1500);
    lcd.clear();

    // BMP280 Initialization
    if (!bmp.begin(0x76)) {
        lcd.print("BMP280 Error!");
        Serial.println("BMP280 initialization failed!");
        while (1)
            delay(10);
    }

    // DHT11 Initialization
    dht.begin();
    pinMode(RAIN_PIN, INPUT);

    Serial.println("\n=== ESP32 Weather Station ===");
    Serial.printf("Server: %s\n", serverDomain);

    // WiFi Connection
    lcd.setCursor(0, 0);
    lcd.print("Connecting WiFi");
    Serial.print("Connecting to WiFi");

    WiFi.begin(ssid, password);

    int retry = 0;
    while (WiFi.status() != WL_CONNECTED && retry < 30) {
        delay(500);
        Serial.print(".");
        lcd.setCursor(retry % 16, 1);
        lcd.print(".");
        retry++;
    }

    lcd.clear();

    if (WiFi.status() == WL_CONNECTED) {
        lcd.setCursor(0, 0);
        lcd.print("WiFi Connected!");
        lcd.setCursor(0, 1);
        lcd.print(WiFi.localIP());

        Serial.println("\nWiFi Connected!");
        Serial.print("IP Address: ");
        Serial.println(WiFi.localIP());
        Serial.printf("Server: %s\n", serverDomain);
    } else {
        lcd.setCursor(0, 0);
        lcd.print("WiFi Failed!");
        lcd.setCursor(0, 1);
        lcd.print("Offline Mode");
        Serial.println("\nWiFi connection failed - Running offline");
    }

    delay(3000);
    lcd.clear();

    // Initial sensor reading
    readSensors();
}

// ================= LOOP =================
void loop()
{
    // Read sensors at regular intervals
    if (millis() - lastSensorRead >= sensorInterval) {
        readSensors();
        updateLCD();
        lastSensorRead = millis();
    }

    // Post data to server at regular intervals
    if (millis() - lastServerPost >= serverInterval) {
        if (WiFi.status() == WL_CONNECTED) {
            dataPostedSuccessfully = postDataToServer();

            // Optionally fetch latest data from server
            // fetchDataFromServer();
        } else {
            Serial.println("WiFi disconnected. Attempting reconnection...");
            WiFi.reconnect();
        }
        lastServerPost = millis();
    }
}
