import { Router } from "express";
import {
  login,
  register,
  me
} from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  loginSchema,
  registerSchema,
} from "../validations/auth.validation.js";
import authenticate from "../middlewares/auth.middleware.js";

const router = Router();

router.post(
  "/register",
  validate(registerSchema),
  register
);

router.post(
  "/login",
  validate(loginSchema),
  login
);

router.get(
  "/me", 
  authenticate, 
  me);

export default router;