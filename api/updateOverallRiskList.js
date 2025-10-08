// api/updateOverallRiskList.js
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
    const { overallRiskString } = req.body;

    // Validate input
    if (!overallRiskString) {
      return res.status(400).json({ error: "Missing overallRiskString" });
    }

    // Update the OverallRiskList in Firebase
    await database.ref(`OverallRiskList`).set(overallRiskString);

    // Return success
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error in /api/updateOverallRiskList:", error);
    res.status(500).json({ error: "Failed to update overall risk list" });
  }
}
