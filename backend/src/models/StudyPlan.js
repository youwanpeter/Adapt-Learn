import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    topic: { type: mongoose.Schema.Types.ObjectId, ref: "Topic" },
    dateISO: String,
    minutes: Number,
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const planSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    document: { type: mongoose.Schema.Types.ObjectId, ref: "Document" },
    sessions: [sessionSchema],
    dueDateISO: String,
  },
  { timestamps: true }
);

export default mongoose.model("StudyPlan", planSchema);
