import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["student", "admin"], default: "student" },
    preferences: {
      pace: {
        type: String,
        enum: ["slow", "normal", "fast"],
        default: "normal",
      },
      modality: {
        type: String,
        enum: ["text", "video", "mixed"],
        default: "mixed",
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
