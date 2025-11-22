// backend/src/index.js
// -------------------- Load env FIRST --------------------
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try backend/.env (one level up from src) and fall back to process.cwd()
const envPath = fs.existsSync(path.resolve(__dirname, "../.env"))
  ? path.resolve(__dirname, "../.env")
  : path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath });

// Required env
["MONGODB_URI", "JWT_SECRET"].forEach((k) => {
  if (!process.env[k]) {
    console.error(`❌ Missing ${k} in ${envPath}`);
    process.exit(1);
  }
});

// -------------------- Imports --------------------
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";

import { connectDB } from "./config/db.js";
import { notFound, errorHandler } from "./middleware/error.js";

import authRoutes from "./routes/auth.routes.js";
import healthRoutes from "./routes/health.routes.js";
import docRoutes from "./routes/documents.routes.js";
import topicsRoutes from "./routes/topics.routes.js";
import videosRoutes from "./routes/videos.routes.js";
import userRoutes from "./routes/user.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import otpRoutes from "./routes/otp.routes.js"; //

// -------------------- App setup --------------------
const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);

// CORS: accept explicit list via CORS_ORIGINS, otherwise allow localhost/127.0.0.1
const allowList =
  process.env.CORS_ORIGINS?.split(",")
    .map((s) => s.trim())
    .filter(Boolean) || [];

const corsOptions = {
  credentials: true,
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // same-origin / curl
    if (allowList.length === 0) {
      // Dev-friendly default: allow localhost + 127.0.0.1 (any port)
      try {
        const u = new URL(origin);
        if (["localhost", "127.0.0.1"].includes(u.hostname))
          return cb(null, true);
      } catch {}
      return cb(new Error("CORS blocked"), false);
    }
    return allowList.includes(origin)
      ? cb(null, true)
      : cb(new Error("CORS blocked"), false);
  },
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// Serve uploaded files
// Multer should write to "<backend>/uploads" — serve that directory
const uploadsDir = path.resolve(__dirname, "../uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

// -------------------- Routes --------------------
app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/documents", docRoutes);
app.use("/api/topics", topicsRoutes);
app.use("/api/videos", videosRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/otp", otpRoutes);

// -------------------- 404 + error handler --------------------
app.use(notFound);
app.use(errorHandler);

// -------------------- Start server --------------------
const port = Number(process.env.PORT || 4000);
const host = process.env.HOST || "127.0.0.1";

export async function start() {
  try {
    await connectDB();
    app.listen(port, host, () => {
      console.log(`✅ Server running at http://${host}:${port}`);
      if (allowList.length) {
        console.log(`🌐 CORS allow list: ${allowList.join(", ")}`);
      } else {
        console.log("🌐 CORS: localhost/127.0.0.1 allowed by default (dev).");
      }
    });
  } catch (err) {
    console.error("❌ Failed to start:", err?.message || err);
    process.exit(1);
  }
}

// Auto-start unless running under tests
if (process.env.NODE_ENV !== "test") {
  start();
}

export default app;
