import { Router } from "express";

import authenticate from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";

import {
  create,
  getAll,
  getById,
  update,
  remove,
  updateStatus,
} from "../controllers/expenseTypes.controller.js";

import {
  createExpenseTypeSchema,
  updateExpenseTypeSchema,
  updateExpenseTypeStatusSchema,
} from "../validations/expenseTypes.validation.js";

const router = Router();

router.use(authenticate);

router.post("/", validate(createExpenseTypeSchema), create);

router.get("/", getAll);

router.get("/:id", getById);

router.put("/:id", validate(updateExpenseTypeSchema), update);

router.delete("/:id", remove);

router.patch(
  "/:id/status",
  validate(updateExpenseTypeStatusSchema),
  updateStatus
);

export default router;
