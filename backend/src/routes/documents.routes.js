import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { upload } from "../utils/file.js";
import {
  uploadDocument,
  getMyDocuments,
} from "../controllers/documents.controller.js";

const r = Router();

r.post("/upload", requireAuth, upload.single("file"), uploadDocument);
r.get("/mine", requireAuth, getMyDocuments);

export default r;
