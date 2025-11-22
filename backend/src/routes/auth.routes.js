// backend/src/routes/auth.routes.js
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

/* ---------- Common validators ---------- */
const emailField = body("email")
  .trim()
  .isEmail()
  .withMessage("Valid email required");

const codeField = body("code")
  .trim()
  .isLength({ min: 4, max: 8 })
  .withMessage("Code must be 4–8 digits")
  .isNumeric()
  .withMessage("Code must contain only digits");

/* ---------- Routes ---------- */

// REGISTER
r.post(
  "/register",
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    emailField,
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be 6+ chars"),
  ],
  register
);

// VERIFY EMAIL
r.post("/verify-email", [emailField, codeField], verifyEmail);

// LOGIN (step 1)
r.post(
  "/login",
  [emailField, body("password").notEmpty().withMessage("Password required")],
  login
);

// LOGIN (step 2 – OTP)
r.post(
  "/login/verify",
  [
    body("tempToken").notEmpty().withMessage("Session token missing"),
    codeField,
  ],
  verifyLogin
);

// RESEND OTP
r.post(
  "/resend-otp",
  [
    emailField,
    body("purpose")
      .isIn(["verify_email", "login"])
      .withMessage("Invalid purpose"),
  ],
  resendOtp
);

export default r;
