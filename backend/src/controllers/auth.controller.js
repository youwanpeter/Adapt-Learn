// backend/src/controllers/auth.controller.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { validationResult } from "express-validator";
import User from "../models/User.js";
import { signToken } from "../utils/jwt.js";

/* ---------- helpers ---------- */
const OTP_TTL_MIN = Number(process.env.OTP_TTL_MINUTES || 10);

// nodemailer transport – optional (logs OTP to console if not configured)
const transporter =
  process.env.SMTP_HOST && process.env.SMTP_USER
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })
    : null;

async function sendOtpEmail(to, code, purpose = "Verification") {
  const from = process.env.MAIL_FROM || "LearnAI <noreply@learnai.app>";
  const html = `
    <div style="font-family:system-ui,Segoe UI,Roboto,Arial">
      <h2>${purpose} Code</h2>
      <p>Use this code to continue:</p>
      <div style="font-size:26px;font-weight:700;letter-spacing:4px">${code}</div>
      <p>This code expires in <b>${OTP_TTL_MIN} minutes</b>.</p>
    </div>
  `;

  // Dev fallback: still usable even without SMTP
  if (!transporter) {
    console.log(`[DEV] OTP for ${to}: ${code} (${purpose})`);
    return;
  }

  await transporter.sendMail({ from, to, subject: `${purpose} Code`, html });
}

function genOtp(len = 6) {
  const digits = "0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += digits[Math.floor(Math.random() * 10)];
  return out; // keep as STRING to preserve leading zeros
}

function otpExpiry() {
  return new Date(Date.now() + OTP_TTL_MIN * 60 * 1000);
}

function signTempToken(userId) {
  return jwt.sign({ sub: userId, stage: "otp" }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
}

/**
 * Common validation helper.
 * Returns true if a response was already sent (there were errors).
 */
function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors || errors.isEmpty()) return false;

  const arr = errors.array();
  res.status(400).json({
    message: arr[0]?.msg || "Validation failed",
    errors: arr.map((e) => ({
      msg: e.msg,
      param: e.param,
    })),
  });
  return true;
}

/* ---------- OTP helpers using nested otp field ---------- */

function setUserOtp(user, code, purpose) {
  user.otp = {
    code,
    purpose,
    expiresAt: otpExpiry(),
    attempts: 0,
  };
}

function clearUserOtp(user) {
  user.otp = {
    code: null,
    purpose: null,
    expiresAt: null,
    attempts: 0,
  };
}

function isOtpValid(user, expectedPurpose, codeStr) {
  if (!user || !user.otp) return false;
  const { code, purpose, expiresAt } = user.otp;
  if (purpose !== expectedPurpose) return false;
  if (!code || code.trim() !== codeStr) return false;
  if (!expiresAt || expiresAt <= new Date()) return false;
  return true;
}

/* ---------- controllers ---------- */

// POST /api/auth/register
export const register = async (req, res) => {
  if (handleValidation(req, res)) return;

  try {
    const { name, email, password } = req.body;
    if (!email || !password || !name) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required." });
    }

    const normalizedEmail = String(email).toLowerCase();

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(400).json({ message: "Email already used" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: normalizedEmail,
      passwordHash,
      emailVerified: false,
    });

    const code = genOtp(6);
    setUserOtp(user, code, "verify_email");
    await user.save();

    try {
      await sendOtpEmail(user.email, code, "Email Verification");
    } catch (e) {
      console.error("MAIL_SEND_ERROR(register):", e.message);
      // still allow user to verify with console OTP in dev
    }

    return res.json({
      message:
        "Account created. We sent a verification code to your email. Enter it to verify.",
    });
  } catch (err) {
    console.error("REGISTER_ERROR:", err);
    return res.status(500).json({ message: "Server error during register." });
  }
};

// POST /api/auth/verify-email
export const verifyEmail = async (req, res) => {
  if (handleValidation(req, res)) return;

  try {
    const { email, code } = req.body || {};

    if (!email || !code) {
      return res
        .status(400)
        .json({ message: "Email and verification code are required." });
    }

    const normalizedEmail = String(email).toLowerCase();
    const codeStr = String(code).trim();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res
        .status(400)
        .json({ message: "User not found for this email." });
    }

    if (!isOtpValid(user, "verify_email", codeStr)) {
      // optional: bump attempts
      if (user.otp) {
        user.otp.attempts = (user.otp.attempts || 0) + 1;
        await user.save();
      }
      return res
        .status(400)
        .json({ message: "Invalid or expired verification code." });
    }

    user.emailVerified = true;
    clearUserOtp(user);
    await user.save();

    return res.json({ message: "Email verified. You can sign in now." });
  } catch (err) {
    console.error("VERIFY_EMAIL_ERROR:", err);
    return res
      .status(500)
      .json({ message: "Server error during email verification." });
  }
};

// POST /api/auth/login
export const login = async (req, res) => {
  if (handleValidation(req, res)) return;

  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const normalizedEmail = String(email).toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!user.emailVerified) {
      return res
        .status(403)
        .json({ message: "Email not verified. Please verify first." });
    }

    const code = genOtp(6);
    setUserOtp(user, code, "login");
    await user.save();

    try {
      await sendOtpEmail(user.email, code, "Login");
    } catch (e) {
      console.error("MAIL_SEND_ERROR(login):", e.message);
    }

    const tempToken = signTempToken(user._id.toString());
    return res.json({ message: "OTP sent to email", tempToken });
  } catch (err) {
    console.error("LOGIN_ERROR:", err);
    return res.status(500).json({ message: "Server error during login." });
  }
};

// POST /api/auth/login/verify
export const verifyLogin = async (req, res) => {
  if (handleValidation(req, res)) return;

  try {
    const { tempToken, code } = req.body || {};

    const codeStr = String(code || "").trim();

    if (!tempToken || !codeStr) {
      return res
        .status(400)
        .json({ message: "Missing login session or OTP code." });
    }

    let decoded;
    try {
      decoded = jwt.verify(tempToken, process.env.JWT_SECRET);
      if (decoded.stage !== "otp") throw new Error("wrong_stage");
    } catch {
      return res
        .status(400)
        .json({ message: "Invalid session. Please login again." });
    }

    const user = await User.findById(decoded.sub);
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (!isOtpValid(user, "login", codeStr)) {
      if (user.otp) {
        user.otp.attempts = (user.otp.attempts || 0) + 1;
        await user.save();
      }
      return res
        .status(400)
        .json({ message: "Invalid or expired login code." });
    }

    clearUserOtp(user);
    await user.save();

    const token = signToken({ sub: user._id, role: user.role });
    return res.json({
      token,
      accessToken: token, // so frontend can use data.accessToken or data.token
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("VERIFY_LOGIN_ERROR:", err);
    return res
      .status(500)
      .json({ message: "Server error during login verification." });
  }
};

// POST /api/auth/resend-otp
export const resendOtp = async (req, res) => {
  if (handleValidation(req, res)) return;

  try {
    const { email, purpose } = req.body || {};
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const normalizedEmail = String(email).toLowerCase();

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const resolvedPurpose = purpose === "login" ? "login" : "verify_email";

    const code = genOtp(6);
    setUserOtp(user, code, resolvedPurpose);
    await user.save();

    try {
      await sendOtpEmail(
        user.email,
        code,
        resolvedPurpose === "login" ? "Login" : "Email Verification"
      );
    } catch (e) {
      console.error("MAIL_SEND_ERROR(resend):", e.message);
    }

    return res.json({ message: "Code resent." });
  } catch (err) {
    console.error("RESEND_OTP_ERROR:", err);
    return res
      .status(500)
      .json({ message: "Server error when resending OTP." });
  }
};
