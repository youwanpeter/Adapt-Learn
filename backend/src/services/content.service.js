import fs from "fs/promises";
import * as mammothNS from "mammoth"; // CJS compat
import * as pdfParseNS from "pdf-parse"; // CJS compat
import { cleanText } from "../utils/text.js";

const mammoth = mammothNS.default || mammothNS;
const pdfParse = pdfParseNS.default || pdfParseNS;
const hasExt = (p, ext) => p?.toLowerCase?.().endsWith(ext);

export const extractText = async (filePath, mimeType = "") => {
  const mt = (mimeType || "").toLowerCase();
  const fp = (filePath || "").toLowerCase();

  // DOCX
  if (mt.includes("word") || hasExt(fp, ".docx")) {
    const { value } = await mammoth.extractRawText({ path: filePath });
    return cleanText(value || "");
  }

  // PDF
  if (mt.includes("pdf") || hasExt(fp, ".pdf")) {
    try {
      const buf = await fs.readFile(filePath);
      const data = await pdfParse(buf); // <-- now a callable function
      return cleanText(data?.text || "");
    } catch (e) {
      console.error("EXTRACT_TEXT_ERROR(pdf):", e);
      return "";
    }
  }

  // Fallback try UTF-8 text
  try {
    const buf = await fs.readFile(filePath, "utf8");
    return cleanText(buf || "");
  } catch (e) {
    console.error("EXTRACT_TEXT_ERROR(fallback):", e);
    return "";
  }
};
