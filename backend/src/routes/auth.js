import { Router } from "express";
import Joi from "joi";
import { validate } from "../middleware/validate.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import {
  login,
  register,
  refresh,
  me,
  logout,
} from "../controllers/authController.js";

const router = Router();

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().lowercase().email().required(),
  password: Joi.string().min(6).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().lowercase().email().required(),
  password: Joi.string().min(6).required(),
});

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refresh);
router.get("/me", requireAuth, me);
router.post("/logout", logout);

// Example protected route with role
router.get("/admin-only", requireAuth, requireRole("admin"), (req, res) => {
  res.json({ message: "Hello Admin!" });
});

export default router;
