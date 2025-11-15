// backend/src/controllers/users.controller.js
import bcrypt from "bcryptjs";
import User from "../models/User.js";

export const getMe = async (req, res) => {
  const u = await User.findById(req.user.id).lean();
  if (!u) return res.status(404).json({ message: "User not found" });
  const { passwordHash, otpCode, otpPurpose, otpExpiresAt, ...safe } = u;
  res.json(safe);
};

export const updateProfile = async (req, res) => {
  const { name, avatarUrl } = req.body || {};
  const u = await User.findByIdAndUpdate(
    req.user.id,
    {
      ...(name ? { name } : {}),
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
    },
    { new: true }
  ).lean();
  const { passwordHash, otpCode, otpPurpose, otpExpiresAt, ...safe } = u;
  res.json(safe);
};

export const updateNotifications = async (req, res) => {
  const { studyReminders, progressUpdates, recommendations, newsletter } =
    req.body || {};
  const u = await User.findByIdAndUpdate(
    req.user.id,
    {
      notificationSettings: {
        ...(studyReminders !== undefined ? { studyReminders } : {}),
        ...(progressUpdates !== undefined ? { progressUpdates } : {}),
        ...(recommendations !== undefined ? { recommendations } : {}),
        ...(newsletter !== undefined ? { newsletter } : {}),
      },
    },
    { new: true }
  ).lean();
  res.json(u.notificationSettings);
};

export const changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword || newPassword.length < 6)
    return res.status(400).json({ message: "Invalid password" });

  const u = await User.findById(req.user.id);
  if (!u) return res.status(404).json({ message: "User not found" });

  const ok = await bcrypt.compare(oldPassword, u.passwordHash);
  if (!ok)
    return res.status(400).json({ message: "Current password incorrect" });

  u.passwordHash = await bcrypt.hash(newPassword, 10);
  await u.save();
  res.json({ message: "Password updated" });
};

export const deleteMe = async (req, res) => {
  await User.findByIdAndDelete(req.user.id);
  res.json({ message: "Account deleted" });
};
