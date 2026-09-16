import { Router } from "express";
import {
  create,
  getAll,
  getById,
  update,
  updateStatus,
  deposit,
  remove,
} from "../controllers/savingPlans.controller.js";
import authenticate from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  createSavingPlanSchema,
  deleteSavingPlanSchema,
  depositSavingPlanSchema,
  updateSavingPlanStatusSchema,
} from "../validations/savingPlans.validation.js";
import { passwordConfirmLimiter } from "../middlewares/rateLimit.middleware.js";

const router = Router();

router.use(authenticate);

// Every mutation below confirms the account password (see `assertPassword` in
// auth.service.js), so every one of them is rate limited. The limiter sits
// after `authenticate` because it keys on the user id, and before `validate`
// so a flood of malformed bodies still counts against the budget. Reads are
// untouched.
router.get("/", getAll);

router.get("/:id", getById);

router.post(
  "/",
  passwordConfirmLimiter,
  validate(createSavingPlanSchema),
  create
);

router.put(
  "/:id",
  passwordConfirmLimiter,
  validate(createSavingPlanSchema),
  update
);

router.patch(
  "/:id/status",
  passwordConfirmLimiter,
  validate(updateSavingPlanStatusSchema),
  updateStatus
);

router.patch(
  "/:id/deposit",
  passwordConfirmLimiter,
  validate(depositSavingPlanSchema),
  deposit
);

router.delete(
  "/:id",
  passwordConfirmLimiter,
  validate(deleteSavingPlanSchema),
  remove
);


export default router;