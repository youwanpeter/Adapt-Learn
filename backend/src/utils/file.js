import multer from "multer";
import { v4 as uuid } from "uuid";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = "src/uploads";
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) =>
    cb(null, `${uuid()}${path.extname(file.originalname || "")}`),
});

const STRONG_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
  fileFilter: (req, file, cb) => {
    // Allow PDF/DOCX only for now (prevents parser crashes)
    if (STRONG_TYPES.has(file.mimetype)) return cb(null, true);
    return cb(new Error("Only PDF and DOCX are supported for processing"));
  },
});
