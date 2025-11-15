// backend/src/controllers/documents.controller.js
import Document from "../models/Document.js";
import Topic from "../models/Topic.js";
import VideoRec from "../models/VideoRec.js";

import { extractText } from "../services/content.service.js"; // safe if returns "" on unknown types
import { buildTopics } from "../services/nlp.service.js"; // should return [{ title, summary, ... }]
import { genYoutubeQueries } from "../services/openai.service.js"; // returns array of strings
import { searchYoutube } from "../services/youtube.service.js"; // (q) -> [{ videoId, title, channel, url, ... }]

/**
 * POST /api/documents/upload
 * FormData: file
 * Auth: Bearer token (req.user.id is set by authRequired)
 */
export const uploadDocument = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });
    if (!req.file)
      return res
        .status(400)
        .json({ message: "No file uploaded (field name must be 'file')" });

    // 1) Persist the basic document record
    const baseDoc = {
      user: userId, // primary field used elsewhere
      owner: userId, // tolerate schemas that use 'owner'
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      storagePath: req.file.path, // tolerate schemas that use 'storagePath'
      path: req.file.path, // tolerate schemas that use 'path'
      status: "uploaded",
    };

    const doc = await Document.create(baseDoc);

    // 2) Extract text
    let text = "";
    try {
      text = await extractText(req.file.path, req.file.mimetype);
    } catch (e) {
      console.error("EXTRACT_TEXT_ERROR:", e.message || e);
    }

    // 3) Enrich & mark processed
    const wordCount = (text || "").split(/\s+/).filter(Boolean).length;
    doc.text = text || "";
    doc.meta = { ...(doc.meta || {}), words: wordCount };
    doc.status = "processed";
    await doc.save();

    // 4) Build & store topics
    let insertedTopics = [];
    try {
      const topics = (buildTopics(text || "") || []).map((t) => ({
        ...t,
        document: doc._id,
        user: userId,
      }));
      if (topics.length) insertedTopics = await Topic.insertMany(topics);
    } catch (e) {
      console.error("TOPIC_BUILD_ERROR:", e.message || e);
    }

    // 5) Build YouTube recommendations (best-effort)
    let rec = null;
    try {
      // Prefer richer signal (titles of extracted topics) if available
      const topicHints = insertedTopics.map((t) => t.title).filter(Boolean);
      const queries = await genYoutubeQueries(text || "", topicHints);

      // Search: take 2 from each query to diversify, then de-dupe by videoId
      let items = [];
      for (const q of queries) {
        try {
          const found = await searchYoutube(q);
          items = items.concat((found || []).slice(0, 2));
        } catch (se) {
          console.error("YOUTUBE_SEARCH_ERROR:", q, se.message || se);
        }
      }
      const uniq = Object.values(
        (items || []).reduce((acc, v) => {
          if (v?.videoId && !acc[v.videoId]) acc[v.videoId] = v;
          return acc;
        }, {})
      );

      if (queries?.length || uniq?.length) {
        rec = await VideoRec.create({
          document: doc._id,
          user: userId,
          queries,
          items: uniq,
        });
      }
    } catch (e) {
      console.error("VIDEO_REC_ERROR:", e.response?.data || e.message || e);
    }

    return res.json({
      document: {
        _id: doc._id,
        originalName: doc.originalName,
        mimeType: doc.mimeType,
        size: doc.size,
        status: doc.status,
        meta: doc.meta,
      },
      topicsCount: insertedTopics.length,
      recommendedVideos: rec?.items || [],
      queries: rec?.queries || [],
    });
  } catch (e) {
    console.error("UPLOAD_ERROR:", e);
    return res
      .status(500)
      .json({ message: e?.message || "Upload failed unexpectedly" });
  }
};

/**
 * GET /api/documents/mine
 * Returns current user's documents (newest first)
 */
export const getMyDocuments = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const docs = await Document.find({
      $or: [{ user: userId }, { owner: userId }],
    })
      .sort({ createdAt: -1 })
      .select("_id originalName mimeType size status meta createdAt")
      .lean();

    return res.json(docs);
  } catch (e) {
    console.error("GET_MINE_ERROR:", e);
    return res.status(500).json({ message: "Failed to load documents" });
  }
};

/**
 * GET /api/videos/by-document/:id
 * Return stored recommendations for a document
 */
export const getVideosByDocument = async (req, res) => {
  try {
    const rec = await VideoRec.findOne({ document: req.params.id })
      .sort({ createdAt: -1 })
      .lean();
    return res.json(rec?.items || []);
  } catch (e) {
    console.error("GET_VIDEOS_ERROR:", e);
    return res.status(500).json({ message: "Failed to load recommendations" });
  }
};
