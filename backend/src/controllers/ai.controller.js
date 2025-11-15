// src/controllers/ai.controller.js
import { summarizeText } from "../services/openai.service.js";

/**
 * POST /api/ai/summarize
 * body: { text: string, maxSentences?: number }
 */
export async function summarize(req, res) {
  try {
    const { text, maxSentences = 5 } = req.body || {};
    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Provide non-empty 'text'." });
    }
    const summary = await summarizeText(text, Number(maxSentences) || 5);
    res.json({ summary });
  } catch (err) {
    console.error(
      "SUMMARIZE_ERROR:",
      err?.response?.data || err.message || err
    );
    res.status(500).json({ message: "Failed to summarize." });
  }
}
