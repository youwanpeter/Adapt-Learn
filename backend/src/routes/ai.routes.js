// src/routes/ai.routes.js
import { Router } from "express";
import { summarize } from "../controllers/ai.controller.js";

const router = Router();
router.post("/summarize", summarize);

export default router;
