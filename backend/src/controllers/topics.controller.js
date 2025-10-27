import mongoose from "mongoose";
import Topic from "../models/Topic.js";

export const listByDocument = async (req, res) => {
  const { documentId } = req.params;

  if (!mongoose.isValidObjectId(documentId)) {
    return res.status(400).json({ message: "Invalid document id" });
  }

  // return topics for that document (adjust fields/sort as you like)
  const topics = await Topic.find({ document: documentId })
    .sort({ order: 1, createdAt: 1 })
    .lean();

  return res.json(topics);
};

// optional default export
export default { listByDocument };
