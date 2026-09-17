import express from "express";

import authenticate from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import upload from "../middlewares/upload.middleware.js";

import { AVATAR_MAX_MB } from "../constants/limits.js";

import {
  getProfile,
  updateProfile,
  updateAvatar,
  getAvatars,
  selectAvatar,
  deleteAvatar,
  updatePassword
} from "../controllers/user.controller.js";

import {
  updateProfileSchema,
  selectAvatarSchema,
  changePasswordSchema
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
  // Tighter than the general image limit — an avatar is never shown large.
  upload.single("avatar", AVATAR_MAX_MB),
  updateAvatar
);

router.get(
  "/avatars",
  getAvatars
);

router.put(
  "/avatar/select",
  validate(selectAvatarSchema),
  selectAvatar
);

router.delete(
  "/avatars/:fileName",
  deleteAvatar
);

router.put(
  "/change-password",
  validate(changePasswordSchema),
  updatePassword
);

export default router;