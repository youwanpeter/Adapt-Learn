const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { signAccessToken } = require("../utils/jwt");

const register = async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const existing = await User.findOne({ email: normalizedEmail }).lean();
  if (existing)
    return res.status(409).json({ message: "Email already in use" });

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: normalizedEmail,
    password: hash,
  });

  return res.status(201).json({
    message: "User created",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const normalizedEmail = String(email).toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail });
  if (!user)
    return res.status(401).json({ message: "Invalid email or password" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok)
    return res.status(401).json({ message: "Invalid email or password" });

  const token = signAccessToken(
    { sub: user._id, email: user.email },
    process.env.JWT_SECRET
  );

  return res.json({
    message: "Login successful",
    user: { id: user._id, name: user.name, email: user.email },
    accessToken: token,
  });
};

module.exports = { register, login };
