import { initializeApp, cert } from "firebase-admin/app";
import { getDatabase } from "firebase-admin/database";

// Initialize Firebase Admin
const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_CREDENTIAL);
if (!initializeApp.length) {
  // Avoid re-initializing if already initialized
  initializeApp({
    credential: cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

const database = getDatabase();

export default async function handler(req, res) {
  if (req.method === "POST") {
    // Handle write requests
    const { path, data } = req.body;
    if (!path || !data) {
      return res.status(400).json({ error: "Path and data are required." });
    }

    try {
      await database.ref(path).set(data);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error writing to Firebase:", error);
      res.status(500).json({ error: "Failed to write to Firebase" });
    }
  } else if (req.method === "GET") {
    // Handle read requests
    const { path } = req.query;
    if (!path) {
      return res.status(400).json({ error: "Path is required." });
    }

    try {
      const snapshot = await database.ref(path).once("value");
      res.status(200).json(snapshot.val());
    } catch (error) {
      console.error("Error reading from Firebase:", error);
      res.status(500).json({ error: "Failed to read from Firebase" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
