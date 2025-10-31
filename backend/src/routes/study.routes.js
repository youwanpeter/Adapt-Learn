import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { createPlan, myPlans } from "../controllers/study.controller.js";

const r = Router();
r.post("/", requireAuth, createPlan);
r.get("/mine", requireAuth, myPlans);
export default r;
