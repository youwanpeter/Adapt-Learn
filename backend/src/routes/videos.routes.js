import { Router } from "express";
import { authRequired } from "../middleware/authRequired.js";
import { getByDocument } from "../controllers/videos.controller.js";

const router = Router();

// GET /api/videos/by-document/:id  -> always 200 ([]) even if no recs yet
router.get("/by-document/:id", authRequired, getByDocument);

export default router;
