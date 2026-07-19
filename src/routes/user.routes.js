import express from "express";

import authenticate from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import upload from "../middlewares/upload.middleware.js";

import {
  getProfile,
  updateProfile,
  updateAvatar
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

router.put(
  "/avatar",
  upload.single("avatar"),
  updateAvatar
);

export default router;