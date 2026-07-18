import { Router } from "express";
import { create } from "../controllers/savingPlans.controller.js";
import authenticate from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createSavingPlanSchema } from "../validations/savingPlans.validation.js";

const router = Router();

router.post(
  "/",
  authenticate,
  validate(createSavingPlanSchema),
  create
);

export default router;