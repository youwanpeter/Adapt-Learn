// src/routes/auth.routes.js
import { Router } from "express";
import { requestOtp, verifyOtp } from "../controllers/otp.controller.js";

const router = Router();

router.post("/otp/request", requestOtp); // POST /api/auth/otp/request
router.post("/otp/verify", verifyOtp); // POST /api/auth/otp/verify

export default router;
