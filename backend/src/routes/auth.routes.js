import { Router } from "express";
import { body } from "express-validator";
import {
  register,
  verifyEmail,
  login,
  verifyLogin,
  resendOtp,
} from "../controllers/auth.controller.js";

const r = Router();

r.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be 6+ chars"),
  ],
  register
);

r.post(
  "/verify-email",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("code")
      .isLength({ min: 4, max: 8 })
      .withMessage("Code must be 4-8 digits"),
  ],
  verifyEmail
);

r.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("password").notEmpty().withMessage("Password required"),
  ],
  login
);

r.post(
  "/login/verify",
  [
    body("tempToken").notEmpty().withMessage("Session token missing"),
    body("code")
      .isLength({ min: 4, max: 8 })
      .withMessage("Code must be 4-8 digits"),
  ],
  verifyLogin
);

r.post(
  "/resend-otp",
  [
    body("email").isEmail().withMessage("Valid email required"),
    body("purpose")
      .isIn(["verify_email", "login"])
      .withMessage("Invalid purpose"),
  ],
  resendOtp
);

export default r;
