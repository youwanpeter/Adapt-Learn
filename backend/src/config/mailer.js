// src/config/mailer.js
import nodemailer from "nodemailer";

export const mailer = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false, // true only if you use port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// (optional) verify on startup
export async function verifyMailer() {
  try {
    await mailer.verify();
    console.log("📧 Mailer ready");
  } catch (err) {
    console.error("❌ Mailer error:", err.message);
  }
}
