import { Router } from "express";

import authenticate from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";

import {
    create,
    getAll,
    getById,
    update,
    remove,
} from "../controllers/expenseRecords.controller.js";

import {
    createExpenseRecordSchema
} from "../validations/expenseRecords.validation.js";

const router = Router();

router.use(authenticate);

router.post(
    "/",
    validate(createExpenseRecordSchema),
    create
);

router.get("/",getAll);

router.get("/:id",getById);

router.put(
    "/:id",
    validate(createExpenseRecordSchema),
    update
);

router.delete("/:id",remove);

export default router;