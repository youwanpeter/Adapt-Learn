const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email"],
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      required: true,
      trim: true,
    },
    prefs: {
      studyPace: { type: Number, default: 1 }, // or String if needed
      notifyAt: { type: String, default: "" }, // or Date if needed
    },
    progress: { type: [mongoose.Schema.Types.Mixed], default: [] },
    password: { type: String, required: true, minlength: 6 },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model("User", userSchema);
