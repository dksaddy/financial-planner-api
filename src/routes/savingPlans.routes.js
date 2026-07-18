import { Router } from "express";
import {
  create,
  getAll,
  getById,
  update,
  remove,
} from "../controllers/savingPlans.controller.js";
import authenticate from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { createSavingPlanSchema } from "../validations/savingPlans.validation.js";

const router = Router();

router.use(authenticate);

router.post("/", validate(createSavingPlanSchema), create);

router.get("/", getAll);

router.get("/:id", getById);

router.put("/:id", validate(createSavingPlanSchema), update);

router.delete("/:id", remove);


export default router;