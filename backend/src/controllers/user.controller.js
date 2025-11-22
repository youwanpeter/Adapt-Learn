// backend/src/controllers/users.controller.js
import bcrypt from "bcryptjs";
import User from "../models/User.js";

/* ==================== GET /api/users/me ==================== */
export const getMe = async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const u = await User.findById(userId).lean();
    if (!u) return res.status(404).json({ message: "User not found" });

    const {
      passwordHash,
      otp,
      otpCode,
      otpPurpose,
      otpExpiresAt,
      __v,
      ...safe
    } = u;
    return res.json(safe);
  } catch (err) {
    console.error("GET_ME_ERROR:", err);
    return res.status(500).json({ message: "Failed to load profile" });
  }
};

/* ==================== PATCH /api/users/me/profile ==================== */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { name, avatarUrl } = req.body || {};

    const updated = await User.findByIdAndUpdate(
      userId,
      {
        ...(name ? { name } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
      },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: "User not found" });

    const {
      passwordHash,
      otp,
      otpCode,
      otpPurpose,
      otpExpiresAt,
      __v,
      ...safe
    } = updated;
    return res.json(safe);
  } catch (err) {
    console.error("UPDATE_PROFILE_ERROR:", err);
    return res.status(500).json({ message: "Failed to update profile" });
  }
};

/* ==================== PATCH /api/users/me/notifications ==================== */
export const updateNotifications = async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const fields = [
      "studyReminders",
      "progressUpdates",
      "recommendations",
      "newsletter",
    ];
    const updates = {};

    fields.forEach((key) => {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    });

    const updated = await User.findByIdAndUpdate(
      userId,
      { notificationSettings: updates },
      { new: true }
    ).lean();

    if (!updated) return res.status(404).json({ message: "User not found" });

    return res.json(updated.notificationSettings);
  } catch (err) {
    console.error("UPDATE_NOTIFICATIONS_ERROR:", err);
    return res.status(500).json({ message: "Failed to update notifications" });
  }
};

/* ==================== PATCH /api/users/me/password ==================== */
export const changePassword = async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { oldPassword, newPassword } = req.body || {};
    if (!oldPassword || !newPassword || newPassword.length < 6)
      return res.status(400).json({ message: "Invalid password" });

    const u = await User.findById(userId);
    if (!u) return res.status(404).json({ message: "User not found" });

    const ok = await bcrypt.compare(oldPassword, u.passwordHash);
    if (!ok)
      return res.status(400).json({ message: "Current password incorrect" });

    u.passwordHash = await bcrypt.hash(newPassword, 10);
    await u.save();

    return res.json({ message: "Password updated" });
  } catch (err) {
    console.error("CHANGE_PASSWORD_ERROR:", err);
    return res.status(500).json({ message: "Failed to change password" });
  }
};

/* ==================== DELETE /api/users/me ==================== */
export const deleteMe = async (req, res) => {
  try {
    const userId = req.user?.sub;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    await User.findByIdAndDelete(userId);
    return res.json({ message: "Account deleted" });
  } catch (err) {
    console.error("DELETE_USER_ERROR:", err);
    return res.status(500).json({ message: "Failed to delete account" });
  }
};
