import jwt from "jsonwebtoken";
import { ENV } from "../config/env.js";

const getSecret = () => {
  if (!ENV.JWT_SECRET) throw new Error("JWT_SECRET missing (set it in .env)");
  return ENV.JWT_SECRET;
};

export const signToken = (payload, expiresIn = "7d") =>
  jwt.sign(payload, getSecret(), { expiresIn });

export const verifyToken = (token) => jwt.verify(token, getSecret());
