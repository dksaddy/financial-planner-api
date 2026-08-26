import { Router } from "express";
import {
  login,
  register,
  me,
  logout,
} from "../controllers/auth.controller.js";
import validate from "../middlewares/validate.middleware.js";
import {
  loginSchema,
  registerSchema,
} from "../validations/auth.validation.js";
import authenticate from "../middlewares/auth.middleware.js";
import { authLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  register
);

router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  login
);

router.get(
  "/me",
  authenticate,
  me);

router.post(
  "/logout",
  authenticate,
  logout
);

export default router;