import * as savingPlansRepository from "../repositories/savingPlans.repository.js";

export const createSavingPlan = async (userId, data) => {
  return await savingPlansRepository.create(userId, data);
};