// src/services/content.service.js
import fs from "fs/promises";
import { createRequire } from "module";
import { cleanText } from "../utils/text.js";

// Force-load CJS libs so we get real callables under ESM
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse"); // <- function
const mammoth = require("mammoth"); // <- has extractRawText

const hasExt = (p = "", ext = "") => p.toLowerCase().endsWith(ext);
const mtHas = (mt = "", needle = "") =>
  (mt || "").toLowerCase().includes(needle);

export const extractText = async (filePath, mimeType = "") => {
  try {
    // ---- DOCX ----
    if (mtHas(mimeType, "word") || hasExt(filePath, ".docx")) {
      const { value } = await mammoth.extractRawText({ path: filePath });
      return cleanText(value || "");
    }

    // ---- PDF ----
    if (mtHas(mimeType, "pdf") || hasExt(filePath, ".pdf")) {
      const buf = await fs.readFile(filePath);
      const data = await pdfParse(buf); // <- callable now
      return cleanText(data?.text || "");
    }

    // ---- Fallback as UTF-8 text ----
    const txt = await fs.readFile(filePath, "utf8").catch(() => "");
    return cleanText(txt || "");
  } catch (e) {
    console.error("EXTRACT_TEXT_ERROR:", e);
    return "";
  }
};
