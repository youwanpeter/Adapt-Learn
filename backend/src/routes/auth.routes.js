import { Router } from "express";
import { body } from "express-validator";
import { login, register } from "../controllers/auth.controller.js";

const r = Router();
r.post(
  "/register",
  [
    body("name").isString().notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
  ],
  register
);

r.post("/login", [body("email").isEmail(), body("password").notEmpty()], login);

export default r;
