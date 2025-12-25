# 🌤️ Local Weather Monitoring System

An IoT-based weather monitoring system using **ESP32**,  
**BME280**, **DHT11**, **LDR**, and **Rain Sensor** with a web dashboard.

---

## ✨ Features
- 🌡️ Temperature & Humidity  
- 🌬️ Atmospheric Pressure  
- 🌧️ Rain Detection  
- 💡 Light Intensity  
- 📊 Real-time Web Dashboard  

---

## 🧰 Hardware Used
- ESP32 DevKit V1  
- BME280  
- DHT11  
- LDR Module  
- Rain Sensor  

---

## 🏗️ Architecture
**ESP32 → REST API → Backend → Web Dashboard**

---

## 🚀 Getting Started
1. Flash ESP32 firmware  
2. Run backend server  
3. Open dashboard in browser  

---

## 📁 Repository Structure

```text
Local_Weather_Monitoring_System-IOT/
│
├── README.md
│
├── firmware/
│   └── esp32_weather.ino
│
├── web/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
└── docs/
    ├── wiring.png
    └── dashboard.png
