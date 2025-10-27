import Document from "../models/Document.js";
import Topic from "../models/Topic.js";
import { extractText } from "../services/content.service.js";
import { buildTopics } from "../services/nlp.service.js";

// POST /api/documents/upload
export const uploadDocument = async (req, res) => {
  try {
    if (!req.user?.sub)
      return res.status(401).json({ message: "Unauthorized" });
    if (!req.file)
      return res
        .status(400)
        .json({ message: "No file uploaded (field 'file')" });

    const doc = await Document.create({
      owner: req.user.sub,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      status: "uploaded",
    });

    let text = "";
    try {
      text = await extractText(req.file.path, req.file.mimetype);
    } catch (e) {
      console.error("EXTRACT_TEXT_ERROR:", e);
    }

    doc.text = text || "";
    doc.meta = { words: (text || "").split(/\s+/).filter(Boolean).length };
    doc.status = "processed"; // make sure your schema enum includes 'processed'
    await doc.save();

    const topics = buildTopics(text || "").map((t) => ({
      ...t,
      document: doc._id,
    }));
    const inserted = topics.length ? await Topic.insertMany(topics) : [];

    return res.json({ document: doc, topicsCount: inserted.length });
  } catch (e) {
    console.error("UPLOAD_ERROR:", e);
    return res.status(400).json({ message: e.message || "Upload failed" });
  }
};

// GET /api/documents/mine
export const getMyDocuments = async (req, res) => {
  if (!req.user?.sub) return res.status(401).json({ message: "Unauthorized" });
  const docs = await Document.find({ owner: req.user.sub }).sort({
    createdAt: -1,
  });
  res.json(docs);
};

// (optional default export if you prefer)
export default { uploadDocument, getMyDocuments };
