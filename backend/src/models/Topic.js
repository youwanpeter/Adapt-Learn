import mongoose from "mongoose";

const topicSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      index: true,
      required: true,
    },
    title: { type: String, required: true },
    summary: { type: String },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Topic", topicSchema);
