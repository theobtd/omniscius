import { initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

// Initialize Firebase Admin (only once)
if (!initializeApp.length) {
  const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIAL);
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

const database = getDatabase();

export default async function handler(req, res) {
  const { lat, lon, regionName } = req.query; // Add regionName to identify the region

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

    // Process weather data (same logic as your frontend)
    const processedData = {
      tempmin_5days: Math.min(...weatherData.list.map(item => item.main.temp_min)),
      tempmax_5days: Math.max(...weatherData.list.map(item => item.main.temp_max)),
      temp_5days: weatherData.list.reduce((acc, item) => acc + item.main.temp, 0) / weatherData.list.length,
      humidity_5days: weatherData.list.reduce((acc, item) => acc + item.main.humidity, 0) / weatherData.list.length,
      precip_5days: weatherData.list.reduce((acc, item) => acc + (item.rain ? item.rain['3h'] || 0 : 0), 0)
    };

    // Save to Firebase using Admin SDK (bypasses rules)
    await database.ref(`WeatherData/${regionName}`).set(processedData);

    // Return success
    res.status(200).json({ success: true, data: processedData });
  } catch (error) {
    console.error("Error in /api/weather:", error);
    res.status(500).json({ error: "Failed to fetch/save weather data" });
  }
}
