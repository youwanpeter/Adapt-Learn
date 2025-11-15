// backend/src/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["student", "admin"], default: "student" },

    avatarUrl: { type: String, default: "" },

    notificationSettings: {
      studyReminders: { type: Boolean, default: true },
      progressUpdates: { type: Boolean, default: true },
      recommendations: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: false },
    },

    emailVerified: { type: Boolean, default: false },

    otpCode: { type: String, default: null },
    otpPurpose: { type: String, default: null }, // "verify_email" | "login"
    otpExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
