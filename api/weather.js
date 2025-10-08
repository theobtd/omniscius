// api/weather.js
import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

// Initialize Firebase Admin (only once)
let app;
if (!getApps().length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIAL);
  app = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
} else {
  app = getApp(); // Use existing app
}

const database = getDatabase(app);

export default async function handler(req, res) {
  // Enable CORS for your domain
  res.setHeader("Access-Control-Allow-Origin", "https://santepotager.fr");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Extract query params
  const { lat, lon, regionName } = req.query;

  // Validate inputs
  if (!lat || !lon || !regionName) {
    return res.status(400).json({ error: "Missing lat, lon, or regionName" });
  }

  // Fetch weather data
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch weather data");
    const weatherData = await response.json();

    // Process weather data
    const processedData = {
      tempmin_5days: Math.min(...weatherData.list.map(item => item.main.temp_min)),
      tempmax_5days: Math.max(...weatherData.list.map(item => item.main.temp_max)),
      temp_5days: weatherData.list.reduce((acc, item) => acc + item.main.temp, 0) / weatherData.list.length,
      humidity_5days: weatherData.list.reduce((acc, item) => acc + item.main.humidity, 0) / weatherData.list.length,
      precip_5days: weatherData.list.reduce((acc, item) => acc + (item.rain ? item.rain['3h'] || 0 : 0), 0)
    };

    // Save to Firebase
    await database.ref(`WeatherData/${decodeURIComponent(regionName)}`).set(processedData);

    // Return success
    res.status(200).json({ success: true, data: processedData });
  } catch (error) {
    console.error("Error in /api/weather:", error);
    res.status(500).json({ error: "Failed to fetch/save weather data" });
  }
}
