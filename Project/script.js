// WeatherAPI Configuration
const WEATHER_API_KEY = "173f007b5b964eaea4a143624252906"; // Replace with your WeatherAPI.com API key
const WEATHER_BASE_URL = "https://api.weatherapi.com/v1";

// Initialize the app
document.addEventListener("DOMContentLoaded", function () {
  // Check if API key is configured
  if (WEATHER_API_KEY === "YOUR_WEATHERAPI_KEY_HERE") {
    document.querySelector(".api-notice").style.display = "block";
  } else {
    document.querySelector(".api-notice").style.display = "none";
    // Load default city
    searchWeather("London");
  }

  // Add enter key support for search
  document
    .getElementById("cityInput")
    .addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        searchWeather();
      }
    });
});

async function searchWeather(defaultCity = null) {
  const city = defaultCity || document.getElementById("cityInput").value.trim();
  if (!city && !defaultCity) {
    showError("Please enter a city name");
    return;
  }

  if (WEATHER_API_KEY === "YOUR_WEATHERAPI_KEY_HERE") {
    showError("Please configure your WeatherAPI.com API key first");
    return;
  }

  showLoading();

  try {
    // Fetch current weather and air quality data
    const currentResponse = await fetch(
      `${WEATHER_BASE_URL}/current.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(
        city
      )}&aqi=yes`
    );

    if (!currentResponse.ok) {
      throw new Error("City not found or API error");
    }

    const currentData = await currentResponse.json();

    // Fetch forecast data
    const forecastResponse = await fetch(
      `${WEATHER_BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${encodeURIComponent(
        city
      )}&days=5&aqi=no`
    );
    const forecastData = await forecastResponse.json();

    // Display all data
    displayWeatherData(currentData);
    displayAirQualityData(currentData);
    displayForecastData(forecastData);

    document.getElementById(
      "locationInfo"
    ).textContent = `${currentData.location.name}, ${currentData.location.region}, ${currentData.location.country}`;
    hideLoading();
  } catch (error) {
    console.error("Weather API Error:", error);
    showError(
      `Error: ${error.message}. Please check the city name and try again.`
    );
    hideLoading();
  }
}

async function getCurrentLocation() {
  if (!navigator.geolocation) {
    showError("Geolocation is not supported by this browser");
    return;
  }

  if (WEATHER_API_KEY === "YOUR_WEATHERAPI_KEY_HERE") {
    showError("Please configure your WeatherAPI.com API key first");
    return;
  }

  showLoading();

  navigator.geolocation.getCurrentPosition(
    async function (position) {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      try {
        // Fetch weather data by coordinates
        const currentResponse = await fetch(
          `${WEATHER_BASE_URL}/current.json?key=${WEATHER_API_KEY}&q=${lat},${lon}&aqi=yes`
        );

        if (!currentResponse.ok) {
          throw new Error("Unable to fetch weather data for your location");
        }

        const currentData = await currentResponse.json();

        // Fetch forecast data
        const forecastResponse = await fetch(
          `${WEATHER_BASE_URL}/forecast.json?key=${WEATHER_API_KEY}&q=${lat},${lon}&days=5&aqi=no`
        );
        const forecastData = await forecastResponse.json();

        // Display all data
        displayWeatherData(currentData);
        displayAirQualityData(currentData);
        displayForecastData(forecastData);

        document.getElementById(
          "locationInfo"
        ).textContent = `📍 ${currentData.location.name}, ${currentData.location.region}, ${currentData.location.country}`;
        hideLoading();
      } catch (error) {
        console.error("Location Weather Error:", error);
        showError("Error fetching weather data for your location");
        hideLoading();
      }
    },
    function (error) {
      console.error("Geolocation Error:", error);
      showError("Error getting your location. Please enter a city manually.");
      hideLoading();
    }
  );
}

function displayWeatherData(data) {
  const current = data.current;
  const location = data.location;

  document.getElementById("temperature").textContent = `${Math.round(
    current.temp_c
  )}°C`;
  document.getElementById("description").textContent = current.condition.text;
  document.getElementById("feelsLike").textContent = `${Math.round(
    current.feelslike_c
  )}°C`;
  document.getElementById("humidity").textContent = `${current.humidity}%`;
  document.getElementById("windSpeed").textContent = `${current.wind_kph} km/h`;
  document.getElementById("pressure").textContent = `${current.pressure_mb} mb`;
  document.getElementById("visibility").textContent = `${current.vis_km} km`;
  document.getElementById("uvIndex").textContent = current.uv;

  // Set weather icon
  const iconUrl = `https:${current.condition.icon}`;
  const iconElement = document.getElementById("weatherIcon");
  iconElement.src = iconUrl;
  iconElement.alt = current.condition.text;
}

function displayAirQualityData(data) {
  if (!data.current.air_quality) {
    document.getElementById("aqiLevel").textContent =
      "Air quality data not available";
    return;
  }

  const airQuality = data.current.air_quality;

  // WeatherAPI uses US EPA standard (1-6 scale)
  const aqiValue = Math.round(airQuality["us-epa-index"] || 0);

  // Update AQI level
  const aqiElement = document.getElementById("aqiLevel");
  const aqiLevels = [
    "Unknown",
    "Good",
    "Moderate",
    "Unhealthy for Sensitive Groups",
    "Unhealthy",
    "Very Unhealthy",
    "Hazardous",
  ];
  const aqiClasses = [
    "",
    "aqi-good",
    "aqi-moderate",
    "aqi-unhealthy-sensitive",
    "aqi-unhealthy",
    "aqi-very-unhealthy",
    "aqi-hazardous",
  ];

  aqiElement.textContent = `Air Quality: ${aqiLevels[aqiValue]} (${aqiValue}/6)`;
  aqiElement.className = `aqi-level ${aqiClasses[aqiValue]}`;

  // Update pollutant values
  document.getElementById("co").textContent = `${(airQuality.co || 0).toFixed(
    1
  )} μg/m³`;
  document.getElementById("no2").textContent = `${(airQuality.no2 || 0).toFixed(
    1
  )} μg/m³`;
  document.getElementById("o3").textContent = `${(airQuality.o3 || 0).toFixed(
    1
  )} μg/m³`;
  document.getElementById("pm25").textContent = `${(
    airQuality.pm2_5 || 0
  ).toFixed(1)} μg/m³`;
  document.getElementById("pm10").textContent = `${(
    airQuality.pm10 || 0
  ).toFixed(1)} μg/m³`;
  document.getElementById("so2").textContent = `${(airQuality.so2 || 0).toFixed(
    1
  )} μg/m³`;

  // Show health recommendations
  showHealthRecommendations(aqiValue);
}

function showHealthRecommendations(aqi) {
  const recommendations = {
    1: [
      "Air quality is excellent for outdoor activities",
      "Perfect time for exercise and outdoor sports",
    ],
    2: [
      "Air quality is acceptable for most people",
      "Suitable for all outdoor activities",
    ],
    3: [
      "Air quality is acceptable for most people",
      "Sensitive individuals may experience minor issues",
    ],
    4: [
      "Unhealthy for sensitive groups",
      "Children, elderly, and people with respiratory conditions should limit outdoor activities",
    ],
    5: [
      "Unhealthy air quality",
      "Everyone should limit outdoor activities",
      "Wear a mask when going outside",
    ],
    6: [
      "Very unhealthy air quality",
      "Avoid outdoor activities",
      "Keep windows closed",
      "Use air purifier indoors",
    ],
  };

  const healthList = document.getElementById("healthList");
  const healthContainer = document.getElementById("healthRecommendations");

  healthList.innerHTML = "";

  if (recommendations[aqi]) {
    recommendations[aqi].forEach((rec) => {
      const li = document.createElement("li");
      li.textContent = rec;
      healthList.appendChild(li);
    });
    healthContainer.style.display = "block";
  } else {
    healthContainer.style.display = "none";
  }
}

function displayForecastData(data) {
  const forecastContainer = document.getElementById("forecastContainer");
  forecastContainer.innerHTML = "";

  if (!data.forecast || !data.forecast.forecastday) {
    forecastContainer.innerHTML = "<p>Forecast data not available</p>";
    return;
  }

  data.forecast.forecastday.forEach((day, index) => {
    const date = new Date(day.date);
    const dayName =
      index === 0
        ? "Today"
        : date.toLocaleDateString("en-US", { weekday: "short" });

    const forecastItem = document.createElement("div");
    forecastItem.className = "forecast-item";
    forecastItem.innerHTML = `
                    <div class="forecast-day">${dayName}</div>
                    <img class="forecast-icon" src="https:${
                      day.day.condition.icon
                    }" alt="${day.day.condition.text}">
                    <div class="forecast-temp">${Math.round(
                      day.day.maxtemp_c
                    )}°/${Math.round(day.day.mintemp_c)}°</div>
                    <div style="font-size: 12px; color: #666;">${
                      day.day.condition.text
                    }</div>
                `;

    forecastContainer.appendChild(forecastItem);
  });
}

function showLoading() {
  document.getElementById("loading").style.display = "block";
  document.getElementById("error").style.display = "none";
  document.getElementById("dataContainer").style.display = "none";
}

function hideLoading() {
  document.getElementById("loading").style.display = "none";
  document.getElementById("dataContainer").style.display = "grid";
}

function showError(message) {
  document.getElementById("error").textContent = message;
  document.getElementById("error").style.display = "block";
  document.getElementById("loading").style.display = "none";
}
