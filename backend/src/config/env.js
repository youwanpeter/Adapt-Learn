import "dotenv/config"; // ensure .env is loaded when this file is imported

export const ENV = {
  PORT: process.env.PORT || "4000",
  MONGODB_URI: process.env.MONGODB_URI || "",
  JWT_SECRET: process.env.JWT_SECRET || "",
};
