#include "DHT.h"
#include <Adafruit_BMP280.h>
#include <Adafruit_Sensor.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <Wire.h>

// ================= CONFIG =================
#define SEALEVELPRESSURE_HPA 1013.25

#define DHTPIN 5
#define DHTTYPE DHT11
#define RAIN_PIN 25
#define LDR_PIN 34   // Analog pin (Voltage Divider)

// ================= OBJECTS =================
LiquidCrystal_I2C lcd(0x27, 16, 2);
Adafruit_BMP280 bmp;
DHT dht(DHTPIN, DHTTYPE);
WiFiServer server(80);

// ================= WIFI =================
const char* ssid = "MM-227";
const char* password = "Galib@cse";

// ================= VARIABLES =================
float temperature, pressure, altitude;
float humidity;
float feelsLike, dewPoint;

int rainStatus;
int ldrValue;
int lightPercent;

String heatStatus, weatherStatus, drinkTip, lightStatus;
bool humidifierState;

unsigned long lastTime = 0;
unsigned long timerDelay = 2000;
int lcdPage = 0;

// ================= FUNCTIONS =================
float calculateFeelsLike(float T, float H) {
  return -8.784695 +
         1.61139411 * T +
         2.338549 * H -
         0.14611605 * T * H -
         0.01230809 * T * T -
         0.01642482 * H * H +
         0.00221173 * T * T * H +
         0.00072546 * T * H * H -
         0.00000358 * T * T * H * H;
}

String heatAlarm(float feelsLike) {
  if (feelsLike >= 45) return "DANGER";
  if (feelsLike >= 40) return "ALERT";
  if (feelsLike >= 35) return "CAUTION";
  return "NORMAL";
}

float calculateDewPoint(float T, float H) {
  return T - ((100 - H) / 5.0);
}

String weatherEvaluation(float T, int rain) {
  if (rain == LOW) return "RAINY";
  if (T > 32) return "HOT";
  if (T < 18) return "COLD";
  return "PLEASANT";
}

bool humidityON(float H) {
  return (H < 35);
}

String drinkSuggestion(float feelsLike) {
  if (feelsLike >= 40) return "WATER+ORS";
  if (feelsLike >= 32) return "COLD WATER";
  if (feelsLike >= 25) return "JUICE";
  return "WARM TEA";
}

String lightEvaluation(int percent) {
  if (percent < 30) return "DARK";
  if (percent < 60) return "DIM";
  return "BRIGHT";
}

// ================= SETUP =================
void setup() {
  Serial.begin(115200);

  // ===== ESP32 ADC FIX =====
  analogReadResolution(12);                 // 0–4095
  analogSetPinAttenuation(LDR_PIN, ADC_11db); // Full 0–3.3V range

  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("System Loading");
  delay(2000);
  lcd.clear();

  if (!bmp.begin(0x76)) {
    lcd.print("BMP280 Error");
    while (1);
  }

  dht.begin();
  pinMode(RAIN_PIN, INPUT);

  WiFi.begin(ssid, password);
  lcd.print("WiFi Connecting");

  int retry = 0;
  while (WiFi.status() != WL_CONNECTED && retry < 20) {
    delay(500);
    retry++;
  }

  lcd.clear();
  if (WiFi.status() == WL_CONNECTED) {
    lcd.print("WiFi Connected");
    server.begin();
  } else {
    lcd.print("Offline Mode");
  }

  delay(2000);
  lcd.clear();
}

// ================= LOOP =================
void loop() {
  if (millis() - lastTime > timerDelay) {
    readSensors();
    updateLCD();
    lastTime = millis();
  }

  WiFiClient client = server.available();
  if (client) {
    String html = SendHTML();
    client.println("HTTP/1.1 200 OK");
    client.println("Content-type:text/html\n");
    client.println(html);
    client.stop();
  }
}

// ================= SENSOR READ =================
void readSensors() {
  temperature = bmp.readTemperature();
  pressure = bmp.readPressure() / 100.0F;
  altitude = bmp.readAltitude(SEALEVELPRESSURE_HPA);

  humidity = dht.readHumidity();
  if (isnan(humidity)) humidity = 0;

  rainStatus = digitalRead(RAIN_PIN);

  // ===== LDR ANALOG READ (FIXED) =====
  ldrValue = analogRead(LDR_PIN);                 // 0–4095
  lightPercent = 100 - (ldrValue * 100) / 4095;         // Better than map()
  lightStatus = lightEvaluation(lightPercent);

  feelsLike = calculateFeelsLike(temperature, humidity);
  dewPoint = calculateDewPoint(temperature, humidity);
  heatStatus = heatAlarm(feelsLike);
  weatherStatus = weatherEvaluation(temperature, rainStatus);
  drinkTip = drinkSuggestion(feelsLike);
  humidifierState = humidityON(humidity);

  // Debug
  Serial.print("LDR: ");
  Serial.print(ldrValue);
  Serial.print(" | Light: ");
  Serial.print(lightPercent);
  Serial.println("%");
}

// ================= LCD DISPLAY =================
void updateLCD() {
  lcd.clear();

  if (lcdPage == 0) {
    lcd.setCursor(0, 0);
    lcd.print("T:");
    lcd.print(temperature, 1);
    lcd.print(" H:");
    lcd.print(humidity, 0);

    lcd.setCursor(0, 1);
    lcd.print("Feels:");
    lcd.print(feelsLike, 1);
  }
  else if (lcdPage == 1) {
    lcd.setCursor(0, 0);
    lcd.print("Heat:");
    lcd.print(heatStatus);

    lcd.setCursor(0, 1);
    lcd.print("Dew:");
    lcd.print(dewPoint, 1);
  }
  else if (lcdPage == 2) {
    lcd.setCursor(0, 0);
    lcd.print("Weather:");
    lcd.print(weatherStatus);

    lcd.setCursor(0, 1);
    lcd.print("Rain:");
    lcd.print(rainStatus == LOW ? "YES" : "NO");
  }
  else if (lcdPage == 3) {
    lcd.setCursor(0, 0);
    lcd.print("Humid:");
    lcd.print(humidifierState ? "ON" : "OFF");

    lcd.setCursor(0, 1);
    lcd.print("Drink:");
    lcd.print(drinkTip);
  }
  else if (lcdPage == 4) {
    lcd.setCursor(0, 0);
    lcd.print("Light:");
    lcd.print(lightStatus);

    lcd.setCursor(0, 1);
    lcd.print(lightPercent);
    lcd.print("%");
  }

  lcdPage++;
  if (lcdPage > 4) lcdPage = 0;
}

// ================= WEB PAGE =================
String SendHTML() {
  String ptr = "<html><head><meta http-equiv='refresh' content='5'></head><body>";
  ptr += "<h2>ESP32 Weather Station</h2>";
  ptr += "Temperature: " + String(temperature) + " C<br>";
  ptr += "Humidity: " + String(humidity) + " %<br>";
  ptr += "Feels Like: " + String(feelsLike) + " C<br>";
  ptr += "Heat Alarm: " + heatStatus + "<br>";
  ptr += "Dew Point: " + String(dewPoint) + " C<br>";
  ptr += "Weather: " + weatherStatus + "<br>";
  ptr += "Rain: " + String(rainStatus == LOW ? "YES" : "NO") + "<br>";
  ptr += "Light Level: " + String(lightPercent) + " %<br>";
  ptr += "Light Status: " + lightStatus + "<br>";
  ptr += "Drink Suggestion: " + drinkTip + "<br>";
  ptr += "</body></html>";
  return ptr;
}
