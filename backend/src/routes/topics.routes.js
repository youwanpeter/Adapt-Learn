import { Router } from "express";
import { getTopicsByDocument } from "../controllers/topics.controller.js";
import { requireAuth } from "../middleware/auth.js";

const r = Router();

// protect to match your other /documents/* endpoints
r.get("/by-document/:docId", requireAuth, getTopicsByDocument);

export default r;
