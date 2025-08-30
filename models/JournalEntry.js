import mongoose from "mongoose";

const JournalEntrySchema = new mongoose.Schema({
  text: String,
  sentiment: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const JournalEntry = mongoose.model("JournalEntry", JournalEntrySchema);
export default JournalEntry;
