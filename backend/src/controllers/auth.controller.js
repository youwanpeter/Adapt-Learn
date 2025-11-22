import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { validationResult } from "express-validator";
import User from "../models/User.js";
import { signToken } from "../utils/jwt.js";

/* ---------- helpers ---------- */
const OTP_TTL_MIN = Number(process.env.OTP_TTL_MINUTES || 10);

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
  return out;
}
function otpExpiry() {
  return new Date(Date.now() + OTP_TTL_MIN * 60 * 1000);
}
function signTempToken(userId) {
  return jwt.sign({ sub: userId, stage: "otp" }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
}

function sendValidation(res, req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array().map((e) => ({
        msg: e.msg,
        param: e.param,
      })),
    });
  }
}

/* ---------- controllers ---------- */

export const register = async (req, res) => {
  const v = sendValidation(res, req);
  if (v) return;

  const { name, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email already used" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email,
    passwordHash,
    emailVerified: false,
  });

  const code = genOtp(6);
  user.otpCode = code;
  user.otpExpiresAt = otpExpiry();
  user.otpPurpose = "verify_email";
  await user.save();

  try {
    await sendOtpEmail(user.email, code, "Email Verification");
  } catch (e) {
    console.error("MAIL_SEND_ERROR(register):", e.message);
  }

  return res.json({
    message:
      "Account created. We sent a verification code to your email. Enter it to verify.",
  });
};

export const verifyEmail = async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code)
    return res.status(400).json({ message: "Missing email or code" });

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  const now = new Date();
  const valid =
    user.otpPurpose === "verify_email" &&
    user.otpCode === code &&
    user.otpExpiresAt &&
    user.otpExpiresAt > now;

  if (!valid)
    return res.status(400).json({ message: "Invalid or expired code" });

  user.emailVerified = true;
  user.otpCode = null;
  user.otpExpiresAt = null;
  user.otpPurpose = null;
  await user.save();

  return res.json({ message: "Email verified. You can sign in now." });
};

export const login = async (req, res) => {
  const v = sendValidation(res, req);
  if (v) return;

  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    return res.status(401).json({ message: "Invalid credentials" });

  if (!user.emailVerified)
    return res
      .status(403)
      .json({ message: "Email not verified. Please verify first." });

  const code = genOtp(6);
  user.otpCode = code;
  user.otpExpiresAt = otpExpiry();
  user.otpPurpose = "login";
  await user.save();

  try {
    await sendOtpEmail(user.email, code, "Login");
  } catch (e) {
    console.error("MAIL_SEND_ERROR(login):", e.message);
  }

  const tempToken = signTempToken(user._id.toString());
  return res.json({ message: "OTP sent to email", tempToken });
};

export const verifyLogin = async (req, res) => {
  const { tempToken, code } = req.body;
  if (!tempToken || !code)
    return res.status(400).json({ message: "Missing code or session" });

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
  if (!user) return res.status(400).json({ message: "User not found" });

  const now = new Date();
  const valid =
    user.otpPurpose === "login" &&
    user.otpCode === code &&
    user.otpExpiresAt &&
    user.otpExpiresAt > now;

  if (!valid)
    return res.status(400).json({ message: "Invalid or expired code" });

  user.otpCode = null;
  user.otpExpiresAt = null;
  user.otpPurpose = null;
  await user.save();

  const token = signToken({ sub: user._id, role: user.role });
  return res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl, // ✅ Added avatarUrl here
    },
  });
};

export const resendOtp = async (req, res) => {
  const v = sendValidation(res, req);
  if (v) return;

  const { email, purpose } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ message: "User not found" });

  const code = genOtp(6);
  user.otpCode = code;
  user.otpExpiresAt = otpExpiry();
  user.otpPurpose = purpose === "login" ? "login" : "verify_email";
  await user.save();

  try {
    await sendOtpEmail(
      user.email,
      code,
      purpose === "login" ? "Login" : "Email Verification"
    );
  } catch (e) {
    console.error("MAIL_SEND_ERROR(resend):", e.message);
  }

  res.json({ message: "Code resent." });
};
