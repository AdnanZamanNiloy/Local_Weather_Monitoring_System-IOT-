// Configuration
const API_BASE_URL = 'api/'; // Adjust if needed
let tempHumidityChart, pressureLightChart, rainChart;
let currentChartMode = 'hourly';
let currentChartPeriod = 24;

// Initialize on page load
$(document).ready(function () {
    loadCurrentWeather();
    loadChart('hourly', 24);
    loadStats();

    // Auto-refresh every 30 seconds
    setInterval(loadCurrentWeather, 30000);
});

// Load current weather data
function loadCurrentWeather() {
    // Lightweight refresh indicator (uses existing element)
    $('#last-updated').html('<span class="pulse">Refreshing…</span>');

    $.ajax({
        url: API_BASE_URL + 'get_data.php?mode=current',
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            if (response.success && response.data) {
                displayCurrentWeather(response.data);
                $('#loading').hide();
                $('#weather-grid').show();
                $('#last-updated').html('Updated: ' + new Date(response.data.timestamp).toLocaleString());
            } else {
                showError('No weather data available');
            }
        },
        error: function (xhr, status, error) {
            console.error('Error loading weather data:', error);
            showError('Failed to load weather data. Please check your server connection.');
        }
    });
}

// Display current weather
function displayCurrentWeather(data) {
    // Temperature
    const temp = parseFloat(data.temperature);
    const humidity = parseFloat(data.humidity);
    const feelsLike = calculateFeelsLike(temp, humidity);

    $('#temperature').html(temp.toFixed(1) + '°C');
    $('#feels-like').html('Feels like: ' + feelsLike.toFixed(1) + '°C');

    // Humidity
    $('#humidity').html(humidity.toFixed(1) + '%');
    $('#humidity-status').html(getHumidityStatus(humidity));

    // Light
    const light = parseFloat(data.light);
    $('#light').html(light.toFixed(0));
    $('#light-status').html(getLightStatus(light));

    // Pressure
    const pressure = parseFloat(data.pressure);
    $('#pressure').html(pressure.toFixed(1) + ' hPa');
    $('#pressure-status').html(getPressureStatus(pressure));

    // Rain
    const rain = parseFloat(data.rain);
    $('#rain').html(rain.toFixed(1) + '%');
    $('#rain-status').html(getRainStatus(rain));

    // Timestamp
    const timestamp = new Date(data.timestamp);
    $('#timestamp').html(formatDateTime(timestamp));
    $('#time-ago').html(getTimeAgo(timestamp));

    // Calculate and display Dew Point
    const dewPoint = calculateDewPoint(temp, humidity);
    $('#dew-point').html(dewPoint.toFixed(1) + '°C');
    $('#dew-point-status').html(getDewPointStatus(dewPoint, temp));

    // Display Drink Suggestion
    const drinkInfo = getDrinkSuggestion(temp, humidity, feelsLike);
    $('#drink-amount').html(drinkInfo.amount);
    $('#drink-suggestion').html(drinkInfo.text);

    // Check for Heat Alarm
    checkHeatAlarm(temp, humidity, feelsLike);

    // Generate Weather Evaluation
    generateWeatherEvaluation(temp, humidity, light, pressure, rain);

    // Generate Humidity Recommendation
    generateHumidityRecommendation(humidity, temp);

    // Generate health suggestions
    generateHealthSuggestions(temp, humidity, light, pressure, rain);
}

// Calculate Dew Point
function calculateDewPoint(temp, humidity) {
    // Magnus formula for dew point calculation
    const a = 17.27;
    const b = 237.7;
    const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100.0);
    const dewPoint = (b * alpha) / (a - alpha);
    return dewPoint;
}

// Get Dew Point Status
function getDewPointStatus(dewPoint, temp) {
    const difference = temp - dewPoint;
    if (difference < 2) return '<span class="status-poor">Very Humid</span>';
    if (difference < 5) return '<span class="status-fair">Humid</span>';
    if (difference < 10) return '<span class="status-good">Comfortable</span>';
    return '<span class="status-excellent">Dry & Comfortable</span>';
}

// Get Drink Suggestion
function getDrinkSuggestion(temp, humidity, feelsLike) {
    let amount, text, className;

    // Calculate based on feels like temperature
    if (feelsLike >= 40) {
        amount = '3-4 L/day';
        text = 'Critical: Drink water every 15 min!';
        className = 'drink-high';
    } else if (feelsLike >= 35) {
        amount = '2.5-3 L/day';
        text = 'High risk: Stay hydrated!';
        className = 'drink-high';
    } else if (feelsLike >= 30 || humidity > 70) {
        amount = '2-2.5 L/day';
        text = 'Increase water intake';
        className = 'drink-moderate';
    } else if (temp >= 25) {
        amount = '2 L/day';
        text = 'Maintain hydration';
        className = 'drink-moderate';
    } else {
        amount = '1.5-2 L/day';
        text = 'Normal intake';
        className = 'drink-normal';
    }

    return {
        amount: '<span class="' + className + '">' + amount + '</span>',
        text: '<span class="' + className + '">' + text + '</span>'
    };
}

// Check Heat Alarm
function checkHeatAlarm(temp, humidity, feelsLike) {
    let alertHtml = '';
    let showAlert = false;

    if (feelsLike >= 40) {
        alertHtml = `
            <div class="alert-box heat-warning">
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                    <strong>🚨 EXTREME HEAT WARNING! 🚨</strong><br>
                    Feels Like: ${feelsLike.toFixed(1)}°C | Temperature: ${temp.toFixed(1)}°C | Humidity: ${humidity.toFixed(1)}%<br>
                    <strong>DANGER:</strong> Heat stroke risk! Stay indoors immediately. Drink water constantly. Seek medical help if feeling dizzy or nauseous.
                </div>
            </div>
        `;
        showAlert = true;
    } else if (feelsLike >= 35 || temp >= 38) {
        alertHtml = `
            <div class="alert-box heat-caution">
                <i class="fas fa-fire"></i>
                <div>
                    <strong>⚠️ HEAT CAUTION ALERT ⚠️</strong><br>
                    Feels Like: ${feelsLike.toFixed(1)}°C | Temperature: ${temp.toFixed(1)}°C | Humidity: ${humidity.toFixed(1)}%<br>
                    <strong>WARNING:</strong> High heat stress! Avoid outdoor activities. Stay hydrated. Use air conditioning.
                </div>
            </div>
        `;
        showAlert = true;
    } else if (temp < 10) {
        alertHtml = `
            <div class="alert-box cold-alert">
                <i class="fas fa-snowflake"></i>
                <div>
                    <strong>❄️ COLD WEATHER ALERT ❄️</strong><br>
                    Temperature: ${temp.toFixed(1)}°C<br>
                    <strong>CAUTION:</strong> Cold conditions! Dress in layers. Protect extremities from cold.
                </div>
            </div>
        `;
        showAlert = true;
    }

    if (showAlert) {
        $('#heat-alarm').html(alertHtml);
        $('#alerts-section').slideDown();
    } else {
        $('#alerts-section').slideUp();
    }
}

// Generate Weather Evaluation
function generateWeatherEvaluation(temp, humidity, light, pressure, rain) {
    // Temperature Evaluation (5-star rating)
    let tempStars = 5;
    let tempText = 'Perfect';
    if (temp < 10 || temp > 35) {
        tempStars = 1;
        tempText = 'Very Poor';
    } else if (temp < 15 || temp > 30) {
        tempStars = 2;
        tempText = 'Poor';
    } else if (temp < 18 || temp > 28) {
        tempStars = 3;
        tempText = 'Fair';
    } else if (temp < 20 || temp > 26) {
        tempStars = 4;
        tempText = 'Good';
    }

    $('#temp-rating .stars').html('★'.repeat(tempStars) + '☆'.repeat(5 - tempStars));
    $('#temp-eval').html(tempText);

    // Humidity Evaluation
    let humidityStars = 5;
    let humidityText = 'Optimal';
    if (humidity < 20 || humidity > 80) {
        humidityStars = 1;
        humidityText = 'Very Poor';
    } else if (humidity < 30 || humidity > 70) {
        humidityStars = 2;
        humidityText = 'Poor';
    } else if (humidity < 35 || humidity > 65) {
        humidityStars = 3;
        humidityText = 'Fair';
    } else if (humidity < 40 || humidity > 60) {
        humidityStars = 4;
        humidityText = 'Good';
    }

    $('#humidity-rating .stars').html('★'.repeat(humidityStars) + '☆'.repeat(5 - humidityStars));
    $('#humidity-eval').html(humidityText);

    // Air Quality Evaluation (based on pressure and humidity)
    let airStars = 5;
    let airText = 'Excellent';
    if (pressure < 990 || humidity > 85) {
        airStars = 2;
        airText = 'Poor';
    } else if (pressure < 1005 || humidity > 75) {
        airStars = 3;
        airText = 'Moderate';
    } else if (pressure < 1013 || humidity > 65) {
        airStars = 4;
        airText = 'Good';
    }

    $('#air-rating .stars').html('★'.repeat(airStars) + '☆'.repeat(5 - airStars));
    $('#air-eval').html(airText);

    // Overall Comfort
    const avgStars = Math.round((tempStars + humidityStars + airStars) / 3);
    let overallText = 'Perfect';
    if (avgStars <= 2) overallText = 'Uncomfortable';
    else if (avgStars === 3) overallText = 'Fair';
    else if (avgStars === 4) overallText = 'Comfortable';

    $('#overall-rating .stars').html('★'.repeat(avgStars) + '☆'.repeat(5 - avgStars));
    $('#overall-eval').html(overallText);
}

// Generate Humidity Recommendation
function generateHumidityRecommendation(humidity, temp) {
    let html = '';

    if (humidity > 70) {
        html = `
            <div class="rec-item">
                <div class="rec-icon"><i class="fas fa-fan"></i></div>
                <div class="rec-text">
                    <div class="rec-action">Turn ON Dehumidifier</div>
                    <div class="rec-description">
                        Humidity is too high (${humidity.toFixed(1)}%). Use a dehumidifier or air conditioner to reduce moisture levels.
                        High humidity promotes mold growth and makes the air feel stuffy.
                    </div>
                </div>
            </div>
            <div class="rec-item">
                <div class="rec-icon"><i class="fas fa-wind"></i></div>
                <div class="rec-text">
                    <div class="rec-action">Increase Ventilation</div>
                    <div class="rec-description">
                        Open windows (if outside humidity is lower) or use exhaust fans to improve air circulation.
                    </div>
                </div>
            </div>
        `;
    } else if (humidity < 30) {
        html = `
            <div class="rec-item">
                <div class="rec-icon"><i class="fas fa-water"></i></div>
                <div class="rec-text">
                    <div class="rec-action">Turn ON Humidifier</div>
                    <div class="rec-description">
                        Humidity is too low (${humidity.toFixed(1)}%). Use a humidifier to add moisture to the air.
                        Low humidity can cause dry skin, irritated eyes, and respiratory discomfort.
                    </div>
                </div>
            </div>
            <div class="rec-item">
                <div class="rec-icon"><i class="fas fa-leaf"></i></div>
                <div class="rec-text">
                    <div class="rec-action">Add Indoor Plants</div>
                    <div class="rec-description">
                        Plants naturally release moisture. Consider adding humidity-loving plants like ferns or peace lilies.
                    </div>
                </div>
            </div>
        `;
    } else if (humidity >= 60 && humidity <= 70) {
        html = `
            <div class="rec-item">
                <div class="rec-icon"><i class="fas fa-check-circle"></i></div>
                <div class="rec-text">
                    <div class="rec-action">Humidity Slightly High - Monitor</div>
                    <div class="rec-description">
                        Current humidity: ${humidity.toFixed(1)}%. This is acceptable but approaching the upper comfort limit.
                        Consider using AC or dehumidifier if it increases further.
                    </div>
                </div>
            </div>
        `;
    } else {
        html = `
            <div class="rec-item">
                <div class="rec-icon"><i class="fas fa-smile-beam"></i></div>
                <div class="rec-text">
                    <div class="rec-action">Perfect Humidity Level!</div>
                    <div class="rec-description">
                        Current humidity: ${humidity.toFixed(1)}%. This is within the ideal range (40-60%).
                        No humidity control needed. Maintain current conditions.
                    </div>
                </div>
            </div>
        `;
    }

    $('#humidity-recommendation').html(html);
}

// Calculate "Feels Like" temperature (Heat Index)
function calculateFeelsLike(temp, humidity) {
    if (temp < 27) {
        return temp; // Heat index not applicable for cooler temperatures
    }

    // Heat Index formula (simplified)
    const T = temp;
    const RH = humidity;

    let HI = -8.78469475556 +
        1.61139411 * T +
        2.33854883889 * RH +
        -0.14611605 * T * RH +
        -0.012308094 * T * T +
        -0.0164248277778 * RH * RH +
        0.002211732 * T * T * RH +
        0.00072546 * T * RH * RH +
        -0.000003582 * T * T * RH * RH;

    return HI;
}

// Status helper functions
function getHumidityStatus(humidity) {
    if (humidity < 30) return '<span class="status-poor">Too Dry</span>';
    if (humidity < 40) return '<span class="status-fair">Dry</span>';
    if (humidity <= 60) return '<span class="status-excellent">Comfortable</span>';
    if (humidity <= 70) return '<span class="status-good">Humid</span>';
    return '<span class="status-poor">Very Humid</span>';
}

function getLightStatus(light) {
    if (light < 100) return '<span class="status-poor">Dark</span>';
    if (light < 500) return '<span class="status-fair">Dim</span>';
    if (light < 1000) return '<span class="status-good">Bright</span>';
    return '<span class="status-excellent">Very Bright</span>';
}

function getPressureStatus(pressure) {
    if (pressure < 1000) return '<span class="status-fair">Low (Storm)</span>';
    if (pressure < 1013) return '<span class="status-good">Below Normal</span>';
    if (pressure <= 1020) return '<span class="status-excellent">Normal</span>';
    return '<span class="status-good">High (Clear)</span>';
}

function getRainStatus(rain) {
    if (rain < 20) return '<span class="status-excellent">No Rain</span>';
    if (rain < 50) return '<span class="status-good">Light Rain</span>';
    if (rain < 80) return '<span class="status-warning">Moderate Rain</span>';
    return '<span class="status-poor">Heavy Rain</span>';
}

// Generate health suggestions
function generateHealthSuggestions(temp, humidity, light, pressure, rain) {
    const suggestions = [];

    // Temperature suggestions
    if (temp > 35) {
        suggestions.push({
            type: 'danger',
            icon: 'fa-exclamation-triangle',
            text: '<strong>Heat Warning:</strong> Extreme heat detected! Stay indoors, drink plenty of water, and avoid strenuous activities.'
        });
    } else if (temp > 30) {
        suggestions.push({
            type: 'warning',
            icon: 'fa-thermometer-full',
            text: '<strong>Hot Weather:</strong> Stay hydrated, wear light clothing, and use sunscreen if going outside.'
        });
    } else if (temp < 10) {
        suggestions.push({
            type: 'info',
            icon: 'fa-snowflake',
            text: '<strong>Cold Weather:</strong> Dress warmly in layers and protect exposed skin from cold.'
        });
    } else if (temp >= 20 && temp <= 26) {
        suggestions.push({
            type: 'success',
            icon: 'fa-smile',
            text: '<strong>Perfect Temperature:</strong> Ideal weather conditions! Great time for outdoor activities.'
        });
    }

    // Humidity suggestions
    if (humidity > 70) {
        suggestions.push({
            type: 'warning',
            icon: 'fa-tint',
            text: '<strong>High Humidity:</strong> May feel uncomfortable. Use air conditioning or dehumidifier. Risk of mold growth.'
        });
    } else if (humidity < 30) {
        suggestions.push({
            type: 'info',
            icon: 'fa-wind',
            text: '<strong>Low Humidity:</strong> Use moisturizer, drink water, and consider using a humidifier to prevent dry skin.'
        });
    }

    // Combined heat & humidity (Heat Index)
    const feelsLike = calculateFeelsLike(temp, humidity);
    if (feelsLike > 40) {
        suggestions.push({
            type: 'danger',
            icon: 'fa-fire',
            text: '<strong>Dangerous Heat Index:</strong> Feels like ' + feelsLike.toFixed(1) + '°C! Heat exhaustion and heat stroke are possible. Stay indoors!'
        });
    }

    // Pressure suggestions
    if (pressure < 1000) {
        suggestions.push({
            type: 'warning',
            icon: 'fa-cloud-showers-heavy',
            text: '<strong>Low Pressure:</strong> Stormy weather likely. People with arthritis or migraines may experience discomfort.'
        });
    } else if (pressure > 1020) {
        suggestions.push({
            type: 'success',
            icon: 'fa-sun',
            text: '<strong>High Pressure:</strong> Clear and stable weather expected. Great conditions for outdoor activities!'
        });
    }

    // Rain suggestions
    if (rain > 70) {
        suggestions.push({
            type: 'warning',
            icon: 'fa-umbrella',
            text: '<strong>Heavy Rain Detected:</strong> Stay indoors if possible. Roads may be slippery. Bring an umbrella!'
        });
    } else if (rain > 30) {
        suggestions.push({
            type: 'info',
            icon: 'fa-cloud-rain',
            text: '<strong>Rain Detected:</strong> Carry an umbrella and drive carefully.'
        });
    }

    // Air quality based on combination
    if (temp >= 18 && temp <= 24 && humidity >= 40 && humidity <= 60 && rain < 20) {
        suggestions.push({
            type: 'success',
            icon: 'fa-check-circle',
            text: '<strong>Excellent Conditions:</strong> Perfect weather for exercise, outdoor activities, and fresh air!'
        });
    }

    // Default message if no specific suggestions
    if (suggestions.length === 0) {
        suggestions.push({
            type: 'info',
            icon: 'fa-info-circle',
            text: '<strong>Normal Conditions:</strong> Weather conditions are within normal range. Enjoy your day!'
        });
    }

    // Display suggestions
    let html = '';
    suggestions.forEach(function (suggestion) {
        html += `<div class="suggestion ${suggestion.type}">
                    <i class="fas ${suggestion.icon}"></i>
                    <div>${suggestion.text}</div>
                 </div>`;
    });

    $('#suggestions-content').html(html);
}

// Load historical chart data
function loadChart(mode, period, buttonEl) {
    currentChartMode = mode;
    currentChartPeriod = period;

    // Update active button
    $('.controls .btn').removeClass('active');
    if (buttonEl && buttonEl.classList) {
        buttonEl.classList.add('active');
    }

    const url = mode === 'hourly'
        ? API_BASE_URL + 'get_data.php?mode=hourly&hours=' + period
        : API_BASE_URL + 'get_data.php?mode=daily&days=' + period;

    $.ajax({
        url: url,
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            if (response.success && response.data) {
                displayCharts(response.data, mode);
            }
        },
        error: function (xhr, status, error) {
            console.error('Error loading chart data:', error);
        }
    });
}

// Display charts
function displayCharts(data, mode) {
    // Prepare data
    const labels = [];
    const temperatures = [];
    const humidity = [];
    const pressure = [];
    const light = [];
    const rain = [];

    // Reverse data to show oldest to newest
    data.reverse();

    data.forEach(function (item) {
        if (mode === 'hourly') {
            const date = new Date(item.hour);
            labels.push(date.toLocaleDateString() + ' ' + date.getHours() + ':00');
            temperatures.push(parseFloat(item.avg_temp));
            humidity.push(parseFloat(item.avg_humidity));
            pressure.push(parseFloat(item.avg_pressure));
            light.push(parseFloat(item.avg_light));
            rain.push(parseFloat(item.avg_rain));
        } else {
            labels.push(item.date);
            temperatures.push(parseFloat(item.avg_temp));
            humidity.push(parseFloat(item.avg_humidity));
            pressure.push(parseFloat(item.avg_pressure));
            light.push(parseFloat(item.avg_light));
            rain.push(parseFloat(item.total_rain));
        }
    });

    // Destroy existing charts
    if (tempHumidityChart) tempHumidityChart.destroy();
    if (pressureLightChart) pressureLightChart.destroy();
    if (rainChart) rainChart.destroy();

    // Temperature & Humidity Chart
    const ctx1 = document.getElementById('tempHumidityChart').getContext('2d');
    tempHumidityChart = new Chart(ctx1, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: temperatures,
                borderColor: '#FF6384',
                backgroundColor: 'rgba(255, 99, 132, 0.1)',
                yAxisID: 'y',
                tension: 0.4
            }, {
                label: 'Humidity (%)',
                data: humidity,
                borderColor: '#36A2EB',
                backgroundColor: 'rgba(54, 162, 235, 0.1)',
                yAxisID: 'y1',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Temperature (°C)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Humidity (%)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    }
                }
            }
        }
    });

    // Pressure & Light Chart
    const ctx2 = document.getElementById('pressureLightChart').getContext('2d');
    pressureLightChart = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Pressure (hPa)',
                data: pressure,
                borderColor: '#4BC0C0',
                backgroundColor: 'rgba(75, 192, 192, 0.1)',
                yAxisID: 'y',
                tension: 0.4
            }, {
                label: 'Light',
                data: light,
                borderColor: '#FFCE56',
                backgroundColor: 'rgba(255, 206, 86, 0.1)',
                yAxisID: 'y1',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Pressure (hPa)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Light'
                    },
                    grid: {
                        drawOnChartArea: false,
                    }
                }
            }
        }
    });

    // Rain Chart
    const ctx3 = document.getElementById('rainChart').getContext('2d');
    rainChart = new Chart(ctx3, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: mode === 'hourly' ? 'Rain (%)' : 'Total Rain',
                data: rain,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: '#36A2EB',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: mode === 'hourly' ? 'Rain (%)' : 'Total Rain'
                    }
                }
            }
        }
    });
}

// Load statistics
function loadStats() {
    $.ajax({
        url: API_BASE_URL + 'get_data.php?mode=stats',
        method: 'GET',
        dataType: 'json',
        success: function (response) {
            if (response.success) {
                $('#total-readings').html('Total readings: ' + response.overall.total_readings);
                $('#device-status').html('Device: Online');
            }
        }
    });
}

// Utility functions
function formatDateTime(date) {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
}

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return seconds + ' seconds ago';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' minutes ago';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' hours ago';
    return Math.floor(seconds / 86400) + ' days ago';
}

function showError(message) {
    $('#loading').html('<i class="fas fa-exclamation-circle"></i> ' + message);
}
