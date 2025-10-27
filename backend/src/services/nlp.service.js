// src/services/nlp.service.js
// Heuristic topic extraction (no LLM). Works for PDFs/DOCX with headings.

const titleCase = (s = "") =>
  s
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b([a-z])/g, (m, c) => c.toUpperCase());

const splitSentences = (text = "") => {
  const matches = text.match(/[^.!?]+[.!?]+|\S+$/g);
  return matches ? matches.map((s) => s.trim()) : [text.trim()];
};

const summarize = (text = "", maxSentences = 3, maxChars = 600) => {
  const sents = splitSentences(text).filter(Boolean);
  const summary = sents.slice(0, maxSentences).join(" ");
  return summary.length > maxChars ? summary.slice(0, maxChars) + "…" : summary;
};

// Detect headings at line starts (multiline, case-insensitive)
const HEADING_RE = new RegExp(
  [
    // common academic/course headings
    "chapter\\s+\\d+\\b.*",
    "section\\s+\\d+(?:\\.\\d+)*\\b.*",
    "unit\\s+\\d+\\b.*",
    "lesson\\s+\\d+\\b.*",
    "module\\s+\\d+\\b.*",
    "topic\\s+\\d+\\b.*",
    // typical section names
    "(?:abstract|overview|introduction|background|objectives?|theory|method(?:s|ology)?|implementation|experiment(?:s)?|results?|analysis|evaluation|discussion|limitations?|future\\s+work|conclusion|summary|appendix|references)\\b.*",
    // fallback: Short Title-Case lines can be headings
    "(?=.{3,80}$)(?:[A-Z][a-z]+(?:\\s+[A-Z][a-z]+)+)\\s*$",
  ].join("|"),
  "gim" // global + case-insensitive + multiline
);

const normalize = (raw = "") =>
  raw
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/**
 * Build topics from raw text.
 * Returns [{ title, summary, order }]
 */
export function buildTopics(rawText = "") {
  const text = normalize(rawText);
  if (!text) return [];

  // Find heading positions
  const headings = [];
  let m;
  while ((m = HEADING_RE.exec(text)) !== null) {
    // Avoid matching inside a paragraph by ensuring start of line
    if (m.index === 0 || text[m.index - 1] === "\n") {
      const title = titleCase(m[0].replace(/\n/g, " ").trim());
      headings.push({ index: m.index, title });
    }
    // Prevent zero-length match loops
    if (m.index === HEADING_RE.lastIndex) HEADING_RE.lastIndex++;
  }

  // Fallback: no headings -> chunk by length (~1200 chars)
  if (headings.length === 0) {
    const chunks = [];
    const size = 1200;
    for (let i = 0; i < text.length; i += size) {
      const body = text.slice(i, i + size);
      if (body.trim().length < 200) continue;
      chunks.push({
        title: `Section ${chunks.length + 1}`,
        summary: summarize(body),
        order: chunks.length + 1,
      });
    }
    return chunks.slice(0, 20);
  }

  // Slice sections between headings
  const topics = [];
  for (let i = 0; i < headings.length; i++) {
    const start = headings[i].index;
    const end = i + 1 < headings.length ? headings[i + 1].index : text.length;
    const title = headings[i].title;
    const body = text.slice(start, end).replace(title, "").trim();

    // Skip tiny sections / single-word blobs
    if ((body.match(/\s+/g) || []).length < 30) continue;

    topics.push({
      title,
      summary: summarize(body),
      order: topics.length + 1,
    });
  }

  // If still too few, backfill with coarse chunks
  if (topics.length < 3) {
    const size = 1500;
    let counter = topics.length;
    for (let i = 0; i < text.length && topics.length < 6; i += size) {
      const body = text.slice(i, i + size);
      if (body.trim().length < 200) continue;
      topics.push({
        title: `Section ${++counter}`,
        summary: summarize(body),
        order: topics.length + 1,
      });
    }
  }

  return topics.slice(0, 20);
}
