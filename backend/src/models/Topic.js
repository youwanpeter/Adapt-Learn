import mongoose from "mongoose";

const topicSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      index: true,
    },
    title: String,
    sectionText: String,
    difficulty: { type: Number, min: 1, max: 5, default: 3 },
    estMinutes: { type: Number, default: 8 },
    order: Number,
    keywords: [String],
  },
  { timestamps: true }
);

export default mongoose.model("Topic", topicSchema);
