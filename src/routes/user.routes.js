import express from "express";

import authenticate from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";

import {
  getProfile,
  updateProfile
} from "../controllers/user.controller.js";

import {
  updateProfileSchema
} from "../validations/user.validation.js";

const router = express.Router();

router.use(authenticate);

router.get(
  "/profile",
  getProfile
);

router.put(
  "/profile",
  validate(updateProfileSchema),
  updateProfile
);

export default router;