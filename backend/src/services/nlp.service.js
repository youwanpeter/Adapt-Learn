import {
  splitHeadings,
  estimateDifficulty,
  estimateMinutes,
} from "../utils/text.js";

export const buildTopics = (text) => {
  const sections = splitHeadings(text);
  return sections.map((s) => ({
    title: s.title,
    sectionText: s.sectionText,
    difficulty: estimateDifficulty(s.sectionText),
    estMinutes: estimateMinutes(s.sectionText),
    order: s.order,
    keywords: Array.from(
      new Set(s.sectionText.toLowerCase().match(/\b[a-z]{5,}\b/g) || [])
    ).slice(0, 8),
  }));
};

// extremely simple “summary”: first ~120 words (upgrade later)
export const summarize = (txt, maxWords = 120) => {
  const w = txt.split(/\s+/);
  return w.slice(0, maxWords).join(" ");
};
