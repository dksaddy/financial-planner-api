import { Router } from "express";

import authenticate from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";

import {
  create,
  getAll,
  getById,
  update,
  remove,
} from "../controllers/expenseTypes.controller.js";

import { createExpenseTypeSchema } from "../validations/expenseTypes.validation.js";

const router = Router();

router.use(authenticate);

router.post("/", validate(createExpenseTypeSchema), create);

router.get("/", getAll);

router.get("/:id", getById);

router.put("/:id", validate(createExpenseTypeSchema), update);

router.delete("/:id", remove);

export default router;