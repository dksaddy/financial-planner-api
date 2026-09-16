import * as repository from "../repositories/savingPlans.repository.js";
import AppError from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { SAVING_PLAN_MESSAGES } from "../constants/messages.js";
import { SAVING_PLAN_STATUS } from "../constants/status.js";
import { DEFAULT_TAX_RATE } from "../constants/limits.js";
import { assertPassword } from "./auth.service.js";

// Saving plans are the one resource where every mutation is confirmed with the
// account password. The check lives here rather than in a middleware because
// it belongs with the rule, and because each function below must run it before
// it touches anything — a wrong password may not delete a plan, add a deposit
// or move a status, so `assertPassword` throwing is what keeps that true.
//
// `data.password` is only ever read here; the repositories list their columns
// explicitly, so it cannot reach a query.

export const createSavingPlan = async (userId, data) => {
  await assertPassword(userId, data.password);

  return await repository.create(userId, {
    ...data,
    taxRate: data.taxRate ?? DEFAULT_TAX_RATE,
  });
};

export const getAllSavingPlans = async (userId) => {
  return await repository.findAllByUserId(userId);
};

export const getSavingPlanById = async (id, userId) => {
  const plan = await repository.findById(id, userId);

  if (!plan) {
    throw new AppError(SAVING_PLAN_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  return plan;
};

export const updateSavingPlan = async (id, userId, data) => {
  await assertPassword(userId, data.password);

  const existing = await repository.findById(id, userId);

  if (!existing) {
    throw new AppError(SAVING_PLAN_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  // An update that leaves the rate out keeps the stored one rather than
  // falling back to the default.
  return await repository.update(id, userId, {
    ...data,
    taxRate: data.taxRate ?? existing.tax_rate,
  });
};

// Money is compared in integer cents: numeric columns arrive as strings and
// float arithmetic on them would let 0.1 + 0.2 slip past the cap.
const toCents = (value) => Math.round(Number(value) * 100);

const isFullyDeposited = (plan) =>
  toCents(plan.currently_deposited) >= toCents(plan.deposit_amount);

// active → completed (by hand, or automatically when the last deposit lands)
// completed → active (reopen, only while there is still something to deposit)
// completed → withdrawn (the payout was taken)
// withdrawn is final.
const assertStatusTransition = (plan, status) => {
  if (plan.status === status) return;

  if (plan.status === SAVING_PLAN_STATUS.WITHDRAWN) {
    throw new AppError(
      SAVING_PLAN_MESSAGES.STATUS_FINAL,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  if (
    status === SAVING_PLAN_STATUS.WITHDRAWN &&
    plan.status !== SAVING_PLAN_STATUS.COMPLETED
  ) {
    throw new AppError(
      SAVING_PLAN_MESSAGES.WITHDRAW_NEEDS_COMPLETED,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  if (status === SAVING_PLAN_STATUS.ACTIVE && isFullyDeposited(plan)) {
    throw new AppError(
      SAVING_PLAN_MESSAGES.REOPEN_NEEDS_REMAINING,
      HTTP_STATUS.BAD_REQUEST
    );
  }
};

export const setSavingPlanStatus = async (
  id,
  userId,
  status,
  password
) => {
  await assertPassword(userId, password);

  const existing = await repository.findById(id, userId);

  if (!existing) {
    throw new AppError(SAVING_PLAN_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  assertStatusTransition(existing, status);

  // Guarded on the status that was checked, so a concurrent change between
  // the read and the write cannot sneak an illegal transition through.
  const plan = await repository.updateStatus(
    id,
    userId,
    existing.status,
    status
  );

  if (!plan) {
    throw new AppError(
      SAVING_PLAN_MESSAGES.STATUS_CHANGED_MEANWHILE,
      HTTP_STATUS.CONFLICT
    );
  }

  return plan;
};

export const depositToSavingPlan = async (
  id,
  userId,
  amount,
  password
) => {
  await assertPassword(userId, password);

  const existing = await repository.findById(id, userId);

  if (!existing) {
    throw new AppError(SAVING_PLAN_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  if (existing.status !== SAVING_PLAN_STATUS.ACTIVE) {
    throw new AppError(
      SAVING_PLAN_MESSAGES.DEPOSIT_NEEDS_ACTIVE,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const remainingCents =
    toCents(existing.deposit_amount) -
    toCents(existing.currently_deposited);

  if (toCents(amount) > remainingCents) {
    throw new AppError(
      SAVING_PLAN_MESSAGES.DEPOSIT_EXCEEDS_REMAINING(
        (Math.max(remainingCents, 0) / 100).toFixed(2)
      ),
      HTTP_STATUS.BAD_REQUEST
    );
  }

  // The repository re-checks status and the cap inside the UPDATE, so two
  // deposits racing past the checks above cannot overfill the plan together.
  const plan = await repository.addDeposit(id, userId, amount);

  if (!plan) {
    throw new AppError(
      SAVING_PLAN_MESSAGES.CHANGED_MEANWHILE,
      HTTP_STATUS.CONFLICT
    );
  }

  return plan;
};

export const deleteSavingPlan = async (id, userId, password) => {
  await assertPassword(userId, password);

  const existing = await repository.findById(id, userId);

  if (!existing) {
    throw new AppError(SAVING_PLAN_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  return await repository.remove(id, userId);
};