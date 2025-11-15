import Topic from "../models/Topic.js";
import Document from "../models/Document.js";

/**
 * GET /api/topics/by-document/:docId
 * Returns all topics for a document; enforces ownership when logged in.
 */
export const getTopicsByDocument = async (req, res) => {
  const { docId } = req.params;

  const doc = await Document.findById(docId).select("owner");
  if (!doc) return res.status(404).json({ message: "Document not found" });

  // if route is protected, ensure the same owner
  if (req.user?.sub && String(doc.owner) !== String(req.user.sub)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const topics = await Topic.find({ document: docId })
    .sort({ order: 1, createdAt: 1 })
    .select("-__v");

  return res.json(topics);
};

export default { getTopicsByDocument };
