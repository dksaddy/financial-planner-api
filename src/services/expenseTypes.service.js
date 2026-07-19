import * as repository from "../repositories/expenseTypes.repository.js";
import AppError from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { calculateExpenseTotal } from "../utils/calculation.js";

export const createExpenseType = async (userId, data) => {
  const total = calculateExpenseTotal(data.categories);

  return await repository.create(userId, {
    ...data,
    total,
  });
};

export const getAllExpenseTypes = async (userId) => {
  return await repository.findAllByUserId(userId);
};

export const getExpenseTypeById = async (id, userId) => {
  const expenseType = await repository.findById(id, userId);

  if (!expenseType) {
    throw new AppError("Expense type not found", HTTP_STATUS.NOT_FOUND);
  }

  return expenseType;
};

export const updateExpenseType = async (
  id,
  userId,
  data
) => {
  const total = calculateExpenseTotal(data.categories);

  const expenseType = await repository.update(
    id,
    userId,
    {
      ...data,
      total,
    }
  );

  if (!expenseType) {
    throw new AppError(
      "Expense type not found",
      HTTP_STATUS.NOT_FOUND
    );
  }

  return expenseType;
};

export const deleteExpenseType = async (id, userId) => {
  const expenseType = await repository.remove(id, userId);

  if (!expenseType) {
    throw new AppError("Expense type not found", HTTP_STATUS.NOT_FOUND);
  }

  return expenseType;
};
