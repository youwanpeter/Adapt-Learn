import mongoose from "mongoose";

const videoItemSchema = new mongoose.Schema(
  {
    videoId: String,
    title: String,
    channelTitle: String,
    publishedAt: Date,
    thumbnail: String,
    url: String,
  },
  { _id: false }
);

const videoRecSchema = new mongoose.Schema(
  {
    document: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Document",
      index: true,
    },
    queries: [String],
    items: [videoItemSchema],
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("VideoRec", videoRecSchema);
