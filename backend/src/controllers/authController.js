import User from "../models/User.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/token.js";

const secureCookieOpts = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
};

export const register = async (req, res) => {
  const { name, email, password } = req.body;

  const exists = await User.findOne({ email });
  if (exists)
    return res.status(409).json({ message: "Email already registered" });

  const user = await User.create({ name, email, password });

  // issue tokens
  const payload = { id: user._id, email: user.email, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  user.refreshToken = refreshToken;
  await user.save();

  res
    .cookie("access_token", accessToken, {
      ...secureCookieOpts,
      maxAge: 15 * 60 * 1000,
    })
    .cookie("refresh_token", refreshToken, {
      ...secureCookieOpts,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .status(201)
    .json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user)
    return res.status(401).json({ message: "Invalid email or password" });

  const ok = await user.comparePassword(password);
  if (!ok)
    return res.status(401).json({ message: "Invalid email or password" });

  const payload = { id: user._id, email: user.email, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  user.refreshToken = refreshToken;
  await user.save();

  res
    .cookie("access_token", accessToken, {
      ...secureCookieOpts,
      maxAge: 15 * 60 * 1000,
    })
    .cookie("refresh_token", refreshToken, {
      ...secureCookieOpts,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })
    .json({
      message: "Logged in",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    });
};

export const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refresh_token || req.body?.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ message: "Invalid refresh token" });
    }

    const payload = { id: user._id, email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const newRefresh = signRefreshToken(payload);

    user.refreshToken = newRefresh;
    await user.save();

    res
      .cookie("access_token", accessToken, {
        ...secureCookieOpts,
        maxAge: 15 * 60 * 1000,
      })
      .cookie("refresh_token", newRefresh, {
        ...secureCookieOpts,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      })
      .json({ accessToken, refreshToken: newRefresh });
  } catch (err) {
    res.status(401).json({ message: "Token refresh failed" });
  }
};

export const me = async (req, res) => {
  res.json({ user: req.user });
};

export const logout = async (req, res) => {
  const token = req.cookies?.refresh_token;
  if (token) {
    try {
      const decoded = verifyRefreshToken(token);
      const user = await User.findById(decoded.id);
      if (user) {
        user.refreshToken = null;
        await user.save();
      }
    } catch (_) {}
  }

  res
    .clearCookie("access_token")
    .clearCookie("refresh_token")
    .json({ message: "Logged out" });
};
