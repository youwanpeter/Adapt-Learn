import nodemailer from "nodemailer";

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT || 587),
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function sendMail({ to, subject, html }) {
  const from = process.env.MAIL_FROM || "noreply@example.com";
  return transporter.sendMail({ from, to, subject, html });
}

export function otpEmailTemplate(code, purpose = "Verification") {
  const ttl = process.env.OTP_TTL_MINUTES || 10;
  return `
    <div style="font-family:system-ui,Segoe UI,Roboto,Arial">
      <h2>${purpose} Code</h2>
      <p>Use the following code to continue:</p>
      <div style="font-size:26px;font-weight:700;letter-spacing:4px">${code}</div>
      <p>This code expires in <b>${ttl} minutes</b>. If you didn’t request it, just ignore this email.</p>
    </div>
  `;
}
