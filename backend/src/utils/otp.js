// simple numeric codes (no time drift issues to explain)
export function generateOtp(length = 6) {
  const digits = "0123456789";
  let out = "";
  for (let i = 0; i < length; i++)
    out += digits[Math.floor(Math.random() * 10)];
  return out;
}
export function expiryDate() {
  const mins = Number(process.env.OTP_TTL_MINUTES || 10);
  return new Date(Date.now() + mins * 60 * 1000);
}
