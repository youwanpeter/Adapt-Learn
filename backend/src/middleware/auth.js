// Simple JWT auth middleware (ESM)
import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const token = hdr.startsWith("Bearer ") ? hdr.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Missing token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // standardize user obj: { sub, role }
    req.user = { sub: decoded.sub, role: decoded.role || "student" };
    next();
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}
