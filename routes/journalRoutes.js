// routes/journalRoutes.js
import express from "express";
import mongoose from "mongoose";

const router = express.Router();

// Journal Entry Schema
const journalEntrySchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  mood: { 
    type: String, 
    required: true,
    enum: ['very-happy', 'happy', 'neutral', 'sad', 'very-sad', 'anxious', 'excited', 'calm']
  },
  title: { type: String, required: true },
  content: { type: String, required: true },
  tags: [String],
  moodScore: { type: Number, min: 1, max: 10 }
}, { timestamps: true });

const JournalEntry = mongoose.model("JournalEntry", journalEntrySchema);

// Chat Message Schema for storing conversation history
const chatMessageSchema = new mongoose.Schema({
  message: { type: String, required: true },
  response: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);

// Get all journal entries
router.get("/", async (req, res) => {
  try {
    const entries = await JournalEntry.find().sort({ createdAt: -1 });
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a single journal entry
router.get("/:id", async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.id);
    if (!entry) {
      return res.status(404).json({ message: "Entry not found" });
    }
    res.json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new journal entry
router.post("/", async (req, res) => {
  try {
    const { mood, title, content, tags, moodScore } = req.body;
    
    const newEntry = new JournalEntry({
      mood,
      title,
      content,
      tags: tags || [],
      moodScore
    });

    const savedEntry = await newEntry.save();
    res.status(201).json(savedEntry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update journal entry
router.put("/:id", async (req, res) => {
  try {
    const updatedEntry = await JournalEntry.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    if (!updatedEntry) {
      return res.status(404).json({ message: "Entry not found" });
    }
    res.json(updatedEntry);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete journal entry
router.delete("/:id", async (req, res) => {
  try {
    const deletedEntry = await JournalEntry.findByIdAndDelete(req.params.id);
    if (!deletedEntry) {
      return res.status(404).json({ message: "Entry not found" });
    }
    res.json({ message: "Entry deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Chatbot endpoint using Hugging Face Inference API (Free)
router.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Create a supportive prompt for mental health conversations
    const systemPrompt = `You are a compassionate mental health support assistant. Provide empathetic, helpful responses that encourage positive mental health practices. Keep responses concise and supportive. If someone expresses serious mental health concerns, gently suggest professional help.`;
    
    const fullPrompt = `${systemPrompt}\n\nUser: ${message}\nAssistant:`;

    // Using Hugging Face's free inference API
    const response = await fetch(
      "https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium",
      {
        headers: {
          "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY || 'hf_demo'}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: {
            max_length: 200,
            temperature: 0.7,
            do_sample: true
          }
        }),
      }
    );

    let botResponse;
    
    if (response.ok) {
      const data = await response.json();
      botResponse = data[0]?.generated_text?.replace(fullPrompt, '').trim() || 
                   "I understand you're sharing something important. How are you feeling about that?";
    } else {
      // Fallback responses for when API is unavailable
      const fallbackResponses = [
        "Thank you for sharing that with me. How does writing about this make you feel?",
        "I hear you. It's important to acknowledge your feelings. What would help you feel better right now?",
        "That sounds significant. Remember that it's okay to feel whatever you're feeling. What support do you need?",
        "I appreciate you opening up. Taking time to reflect on your emotions is really valuable. How can I help?",
        "Your feelings are valid. Sometimes just expressing what we're going through can be therapeutic. What's on your mind?"
      ];
      botResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }

    // Save chat history
    const chatEntry = new ChatMessage({
      message,
      response: botResponse
    });
    await chatEntry.save();

    res.json({ response: botResponse });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ 
      response: "I'm here to listen. Sometimes technical issues happen, but your feelings and thoughts are always important. How are you doing today?"
    });
  }
});

// Get chat history
router.get("/chat/history", async (req, res) => {
  try {
    const chatHistory = await ChatMessage.find()
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(chatHistory);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get mood analytics
router.get("/analytics/mood-trends", async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const moodTrends = await JournalEntry.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            mood: "$mood"
          },
          count: { $sum: 1 },
          avgScore: { $avg: "$moodScore" }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);

    res.json(moodTrends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;