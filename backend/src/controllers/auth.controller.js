import bcrypt from "bcryptjs";
import { validationResult } from "express-validator";
import User from "../models/User.js";
import { signToken } from "../utils/jwt.js";

export const register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  const { name, email, password } = req.body;
  const exists = await User.findOne({ email });
  if (exists) return res.status(400).json({ message: "Email already used" });
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash });
  const token = signToken({ sub: user._id, role: user.role });
  res.json({ token, user: { id: user._id, name, email, role: user.role } });
};

export const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(400).json({ errors: errors.array() });
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.passwordHash)))
    return res.status(401).json({ message: "Invalid credentials" });
  const token = signToken({ sub: user._id, role: user.role });
  res.json({
    token,
    user: { id: user._id, name: user.name, email, role: user.role },
  });
};
