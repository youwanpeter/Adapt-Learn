// backend/src/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
    },

    passwordHash: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["student", "admin"],
      default: "student",
    },

    avatarUrl: {
      type: String,
      default: "",
    },

    notificationSettings: {
      studyReminders: { type: Boolean, default: true },
      progressUpdates: { type: Boolean, default: true },
      recommendations: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: false },
    },

    emailVerified: {
      type: Boolean,
      default: false,
    },

    /* -------------------------------
       OTP SECTION (Login / Email Verify)
    -----------------------------------*/

    otp: {
      code: { type: String, default: null }, // the OTP code
      purpose: {
        type: String,
        enum: ["login", "verify_email", "reset_password", null],
        default: null,
      },
      expiresAt: { type: Date, default: null },
      attempts: { type: Number, default: 0 }, // optional: block brute force
    },

    /* OPTIONAL: for Google login, Apple login, etc. */
    provider: {
      type: String,
      enum: ["local", "google", "apple"],
      default: "local",
    },
    providerId: { type: String, default: null }, // Google/Apple user ID
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
