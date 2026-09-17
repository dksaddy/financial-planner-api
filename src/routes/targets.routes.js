import express from "express";

import authenticate from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import upload from "../middlewares/upload.middleware.js";

import { TARGET_IMAGE_MAX_MB } from "../constants/limits.js";

import {
  createTarget,
  getTargets,
  getTarget,
  updateTarget,
  deleteTarget,
} from "../controllers/targets.controller.js";

import {
  createTargetSchema,
  updateTargetSchema,
} from "../validations/targets.validation.js";

const router = express.Router();

router.use(authenticate);

router.post(
  "/",
  upload.single("image", TARGET_IMAGE_MAX_MB),
  validate(createTargetSchema),
  createTarget
);

router.get(
  "/",
  getTargets
);

router.get(
  "/:id",
  getTarget
);

// Accepts JSON, or multipart when a new picture is sent.
router.put(
  "/:id",
  upload.single("image", TARGET_IMAGE_MAX_MB),
  validate(updateTargetSchema),
  updateTarget
);

router.delete(
  "/:id",
  deleteTarget
);

export default router;