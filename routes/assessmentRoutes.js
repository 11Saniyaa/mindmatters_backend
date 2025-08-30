// server/routes/assessmentRoutes.js
import express from "express";
import MoodEntry from "../models/MoodEntry.js";

const router = express.Router();

// POST: Save Assessment
router.post("/", async (req, res) => {
  try {
    console.log("📥 Data received:", req.body); // Log incoming data
    const { name, email, score } = req.body;
    const newEntry = new MoodEntry({ name, email, score });
    const savedEntry = await newEntry.save();
    console.log("✅ Saved entry:", savedEntry); // Confirm save
    res.status(201).json({ message: "Entry saved" });
  } catch (err) {
    console.error("❌ Failed to save:", err.message);
    res.status(500).json({ error: "Failed to save entry" });
  }
});


// GET: All Entries (optional for tracking)
router.get("/", async (req, res) => {
  try {
    const entries = await MoodEntry.find().sort({ submittedAt: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch entries" });
  }
});

export default router;
