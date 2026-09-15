import * as savingPlansRepository from "../repositories/savingPlans.repository.js";
import * as repository from "../repositories/savingPlans.repository.js";
import AppError from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

export const createSavingPlan = async (userId, data) => {
  return await savingPlansRepository.create(userId, data);
};

export const getAllSavingPlans = async (userId) => {
  return await repository.findAllByUserId(userId);
};

export const getSavingPlanById = async (id, userId) => {
  const plan = await repository.findById(id, userId);

  if (!plan) {
    throw new AppError("Saving plan not found", HTTP_STATUS.NOT_FOUND);
  }

  return plan;
};

export const updateSavingPlan = async (id, userId, data) => {
  const existing = await repository.findById(id, userId);

  if (!existing) {
    throw new AppError("Saving plan not found", HTTP_STATUS.NOT_FOUND);
  }

  return await repository.update(id, userId, data);
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

  if (plan.status === "withdrawn") {
    throw new AppError(
      "A withdrawn saving plan cannot change status",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  if (status === "withdrawn" && plan.status !== "completed") {
    throw new AppError(
      "Only a completed saving plan can be withdrawn",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  if (status === "active" && isFullyDeposited(plan)) {
    throw new AppError(
      "A fully deposited saving plan cannot be reopened",
      HTTP_STATUS.BAD_REQUEST
    );
  }
};

export const setSavingPlanStatus = async (id, userId, status) => {
  const existing = await repository.findById(id, userId);

  if (!existing) {
    throw new AppError("Saving plan not found", HTTP_STATUS.NOT_FOUND);
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
      "Saving plan status changed meanwhile, try again",
      HTTP_STATUS.CONFLICT
    );
  }

  return plan;
};

export const depositToSavingPlan = async (id, userId, amount) => {
  const existing = await repository.findById(id, userId);

  if (!existing) {
    throw new AppError("Saving plan not found", HTTP_STATUS.NOT_FOUND);
  }

  if (existing.status !== "active") {
    throw new AppError(
      "Deposits can only be added to active saving plans",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  return await repository.addDeposit(id, userId, amount);
};

export const deleteSavingPlan = async (id, userId) => {
  const existing = await repository.findById(id, userId);

  if (!existing) {
    throw new AppError("Saving plan not found", HTTP_STATUS.NOT_FOUND);
  }

  return await repository.remove(id, userId);
};