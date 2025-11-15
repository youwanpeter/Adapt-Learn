// backend/src/routes/users.routes.js
import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  getMe,
  updateProfile,
  updateNotifications,
  changePassword,
  deleteMe,
} from "../controllers/user.controller.js";

const r = Router();
r.use(requireAuth);

r.get("/me", getMe);
r.patch("/me/profile", updateProfile);
r.patch("/me/notifications", updateNotifications);
r.patch("/me/password", changePassword);
r.delete("/me", deleteMe);

export default r;
