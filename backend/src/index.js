// --- Load env FIRST (from backend/.env) ---
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load ../.env (backend root)
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Basic env validation (fail fast with clear message)
["MONGODB_URI", "JWT_SECRET"].forEach((k) => {
  if (!process.env[k]) {
    console.error(`❌ Missing ${k} in backend/.env`);
    process.exit(1);
  }
});

// --- Imports (safe now that env is loaded) ---
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import healthRoutes from "./routes/health.routes.js";
import { notFound, errorHandler } from "./middleware/error.js";
import docRoutes from "./routes/documents.routes.js";
import topicRoutes from "./routes/topics.routes.js";

// --- App setup ---
const app = express();
app.disable("x-powered-by");

// CORS: allow any origin in dev (tighten in prod with CORS_ORIGINS)
const corsOrigins =
  process.env.CORS_ORIGINS?.split(",").map((s) => s.trim()) || true;
app.use(cors({ origin: corsOrigins, credentials: true }));

app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(morgan("dev"));
app.use("/uploads", express.static("src/uploads"));

// --- Routes ---
app.use("/api/health", healthRoutes); // GET /api/health -> { ok, time }
app.use("/api/auth", authRoutes);

// (Uncomment when you add them)

// import studyRoutes from "./routes/study.routes.js";
app.use("/api/documents", docRoutes);
app.use("/api/topics", topicRoutes);
// app.use("/api/study", studyRoutes);

// --- 404 + error handler ---
app.use(notFound);
app.use(errorHandler);

// --- Start server ---
const port = Number(process.env.PORT || 4000);

// Make sure DB connects before listening
connectDB()
  .then(() => {
    // Bind explicitly to IPv4 to avoid Windows/localhost issues
    app.listen(port, "127.0.0.1", () => {
      console.log(`✅ Server running at http://127.0.0.1:${port}`);
      console.log(
        `🛠  NODE_ENV=${process.env.NODE_ENV || "development"} | DB=connected`
      );
    });
  })
  .catch((err) => {
    console.error("❌ Failed to connect to database:", err.message);
    process.exit(1);
  });

// Optional: catch unhandled errors so the process logs cleanly
process.on("unhandledRejection", (e) => {
  console.error("UNHANDLED_REJECTION:", e);
});
process.on("uncaughtException", (e) => {
  console.error("UNCAUGHT_EXCEPTION:", e);
});
