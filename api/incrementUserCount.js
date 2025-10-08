// api/incrementUserCount.js
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
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const currentDate = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
    const userCountRef = database.ref(`UserCount/${currentDate}`);

    // Increment the count
    await userCountRef.transaction((currentCount) => {
      return (currentCount || 0) + 1;
    });

    // Return success
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in /api/incrementUserCount:", error);
    res.status(500).json({ error: "Failed to increment user count" });
  }
}
