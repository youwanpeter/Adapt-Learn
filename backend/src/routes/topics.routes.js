import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listByDocument } from "../controllers/topics.controller.js";

const r = Router();

// GET /api/topics/by-document/:documentId
r.get("/by-document/:documentId", requireAuth, listByDocument);

export default r;
