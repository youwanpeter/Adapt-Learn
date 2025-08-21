import jwt from "jsonwebtoken";

export const requireAuth = (req, res, next) => {
  // Accept: Authorization: Bearer <token> OR httpOnly cookie named access_token
  const authHeader = req.headers.authorization || "";
  const bearer = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;
  const token = bearer || req.cookies?.access_token;

  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded; // { id, email, role }
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const requireRole = (role) => (req, res, next) => {
  if (!req.user?.role || req.user.role !== role) {
    return res.status(403).json({ message: "Forbidden" });
  }
  next();
};
