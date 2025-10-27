import mongoose from "mongoose";

const docSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    originalName: String,
    mimeType: String,
    size: Number,
    path: String,
    text: String,
    // Make sure 'processed' is allowed here:
    status: {
      type: String,
      enum: ["uploaded", "processed", "failed"],
      default: "uploaded",
      index: true,
    },
    meta: {
      pages: Number,
      words: Number,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Document", docSchema);
