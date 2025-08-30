import mongoose from "mongoose";

const moodEntrySchema = new mongoose.Schema({
  name: String,
  email: String,
  text: String,
  rewritten: {
    positive: String,
    neutral: String,
    negative: String,
  },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("MoodEntry", moodEntrySchema);
