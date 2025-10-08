// api/geocode.js
export default async function handler(req, res) {
  // Enable CORS for your domain
  res.setHeader("Access-Control-Allow-Origin", "https://santepotager.fr");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { postalCode } = req.query;
  if (!postalCode) {
    return res.status(400).json({ error: "Missing postalCode" });
  }

  const apiKey = process.env.OPENWEATHER_API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${postalCode}&appid=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("Failed to fetch coordinates");
    const data = await response.json();
    res.status(200).json({ lat: data.coord.lat, lon: data.coord.lon });
  } catch (error) {
    console.error("Error in /api/geocode:", error);
    res.status(500).json({ error: "Failed to fetch coordinates" });
  }
}
