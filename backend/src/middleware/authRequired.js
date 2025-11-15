import jwt from "jsonwebtoken";

export const authRequired = (req, res, next) => {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // normalize to req.user.sub (your other controllers expect this)
    req.user = {
      sub: payload.id || payload.sub || payload._id || payload.userId,
    };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};
