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