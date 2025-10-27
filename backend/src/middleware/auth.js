import { verifyToken } from "../utils/jwt.js";

export const requireAuth = (req, res, next) => {
  const raw = req.headers.authorization || "";
  const token = raw.startsWith("Bearer ") ? raw.slice(7) : null;
  if (!token) return res.status(401).json({ message: "No token" });
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ message: "Invalid/expired token" });
  }
};
