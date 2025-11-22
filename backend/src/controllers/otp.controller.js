// src/controllers/otp.controller.js
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { mailer } from "../config/mailer.js";

function generateOtp() {
  // 6-digit numeric code
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function requestOtp(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    // find or create user
    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ email });
    }

    const otp = generateOtp();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otpCode = otp;
    user.otpExpiresAt = expires;
    await user.save();

    // send mail
    await mailer.sendMail({
      from: process.env.MAIL_FROM,
      to: email,
      subject: "Your Login OTP",
      text: `Your one-time password is ${otp}. It expires in 10 minutes.`,
      html: `<p>Your one-time password is <b>${otp}</b>.</p>
             <p>It expires in 10 minutes.</p>`,
    });

    return res.json({ message: "OTP sent to email" });
  } catch (err) {
    console.error("REQUEST_OTP_ERROR:", err);
    return res
      .status(500)
      .json({ message: "Failed to send OTP. Please try again." });
  }
}

export async function verifyOtp(req, res) {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      return res
        .status(400)
        .json({ message: "Email and OTP code are required" });

    const user = await User.findOne({ email });
    if (!user || !user.otpCode)
      return res.status(400).json({ message: "OTP not requested" });

    if (user.otpCode !== otp)
      return res.status(400).json({ message: "Invalid OTP" });

    if (!user.otpExpiresAt || user.otpExpiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // clear otp so it can't be reused
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    // issue JWT (or your existing login token)
    const payload = { sub: user._id.toString(), email: user.email };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      message: "OTP verified",
      token,
      user: { id: user._id, email: user.email, name: user.name || "" },
    });
  } catch (err) {
    console.error("VERIFY_OTP_ERROR:", err);
    return res
      .status(500)
      .json({ message: "OTP verification failed. Please try again." });
  }
}
