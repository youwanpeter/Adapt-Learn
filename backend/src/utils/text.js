export const cleanText = (t = "") =>
  t
    .replace(/\s+/g, " ")
    .replace(/\u0000/g, "")
    .trim();

export const splitHeadings = (text) => {
  // naive: split on common heading patterns
  const lines = text.split(/\n|\r/g);
  let sections = [];
  let current = { title: "Introduction", body: [] };

  const isHeading = (s) =>
    /^([A-Z][A-Za-z0-9\s\-:]{0,80})$/.test(s.trim()) && s.trim().length <= 80;

  for (const line of lines) {
    if (isHeading(line) && current.body.length) {
      sections.push(current);
      current = { title: line.trim(), body: [] };
    } else {
      current.body.push(line);
    }
  }
  sections.push(current);
  return sections.map((s, i) => ({
    title: s.title,
    sectionText: cleanText(s.body.join(" ")),
    order: i,
  }));
};

export const estimateDifficulty = (txt) => {
  const len = txt.split(" ").length;
  if (len < 120) return 2;
  if (len < 300) return 3;
  if (len < 700) return 4;
  return 5;
};

export const estimateMinutes = (txt) =>
  Math.max(3, Math.round(txt.split(" ").length / 130));
