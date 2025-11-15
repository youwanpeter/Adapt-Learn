// backend/src/services/openai.service.js
import OpenAI from "openai";

// Make sure OPENAI_API_KEY exists in backend/.env
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/* ---------- helpers ---------- */
function safeJSON(text, fallback = []) {
  try {
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

/* ---------- 1) Summarizer used by /api/ai/summarize ---------- */
export async function summarizeText(text, maxSentences = 5) {
  if (!text || !text.trim()) return "";

  const prompt = `
Summarize the following content in at most ${maxSentences} sentences.
Keep it clear, factual, and study-friendly.

CONTENT:
${text.slice(0, 12000)}
`.trim();

  const resp = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
  });

  return resp.choices?.[0]?.message?.content?.trim() || "";
}

/* ---------- 2) YouTube query generator used in uploads flow ---------- */
export async function genYoutubeQueries(text = "", topics = []) {
  const topicLines = topics
    .slice(0, 10)
    .map((t) => `- ${t.title || ""}: ${t.summary || ""}`)
    .join("\n");

  const prompt = `
You are a helpful study assistant. Based on the following document summary and topics, produce up to 5 concise YouTube search queries a student would type to learn the same material. Keep each query under 80 characters, specific, and remove duplicates. Return ONLY a JSON array of strings.

Document summary (trimmed):
${(text || "").slice(0, 1800)}

Topics:
${topicLines || "- (no extracted topics)"}
`.trim();

  const resp = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  // Try JSON first
  const raw = resp.choices?.[0]?.message?.content?.trim() || "[]";
  let queries = safeJSON(raw, null);

  // Fallback: parse line-by-line
  if (!Array.isArray(queries)) {
    queries = raw
      .split("\n")
      .map((s) => s.replace(/^-+\s*/, "").trim())
      .filter(Boolean);
  }

  // Uniquify + cap length/count
  const uniq = [...new Set(queries)].map((q) => q.slice(0, 80)).slice(0, 5);
  return uniq;
}

export default {
  summarizeText,
  genYoutubeQueries,
};
