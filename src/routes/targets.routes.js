import express from "express";

import authenticate from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";

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