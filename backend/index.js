require("dotenv").config();
const express = require("express");
const cors = require("cors");

const { connectDB } = require("./config/db");
const { corsOptions } = require("./config/corsOptions");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");

const app = express();

const PORT = process.env.PORT || 3001;
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/adaptlearn";

// ---- Core middleware
app.use(express.json());
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// ---- DB
connectDB(MONGO_URI);

// ---- Health
app.get("/health", (_req, res) => res.json({ ok: true }));

// ---- Routes
app.use("/auth", authRoutes); // /auth/register, /auth/login
app.use("/users", userRoutes); // legacy: POST /users

// ---- 404 + error
app.use(notFound);
app.use(errorHandler);

// ---- Listen
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
