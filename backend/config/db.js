const mongoose = require("mongoose");

function connectDB(uri) {
  mongoose.set("strictQuery", true);
  return mongoose
    .connect(uri)
    .then(() => console.log("✅ MongoDB connected"))
    .catch((err) => {
      console.error("❌ MongoDB connection error:", err.message);
      process.exit(1);
    });
}

module.exports = { connectDB };
