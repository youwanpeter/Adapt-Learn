// backend/src/routes/documents.routes.js
import { Router } from "express";
import multer from "multer";
import { authRequired } from "../middleware/authRequired.js";
import {
  uploadDocument,
  getMyDocuments,
  getVideosByDocument,
} from "../controllers/documents.controller.js";

const r = Router();
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 25 * 1024 * 1024 },
});

r.post("/upload", authRequired, upload.single("file"), uploadDocument);
r.get("/mine", authRequired, getMyDocuments);
r.get("/videos/by-document/:id", authRequired, getVideosByDocument);

export default r;
