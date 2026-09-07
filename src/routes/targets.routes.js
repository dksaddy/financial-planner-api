import express from "express";

import authenticate from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import upload from "../middlewares/upload.middleware.js";

import {
  createTarget,
  getTargets,
  getTargetImages,
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
  upload.single("image"),
  validate(createTargetSchema),
  createTarget
);

router.get(
  "/",
  getTargets
);

// Must come before "/:id" or "images" would be parsed as an id.
router.get(
  "/images",
  getTargetImages
);

router.get(
  "/:id",
  getTarget
);

router.put(
  "/:id",
  validate(updateTargetSchema),
  updateTarget
);

router.delete(
  "/:id",
  deleteTarget
);

export default router;