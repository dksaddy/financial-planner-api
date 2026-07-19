import * as repository from "../repositories/expenseRecords.repository.js";
import * as expenseTypeRepository from "../repositories/expenseTypes.repository.js";

import AppError from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

export const createExpenseRecord = async (userId, data) => {
  const expenseType = await expenseTypeRepository.findById(
    data.expense_type_id,
    userId
  );

  if (!expenseType) {
    throw new AppError(
      "Expense type not found",
      HTTP_STATUS.NOT_FOUND
    );
  }

  return await repository.create(userId, {
    expense_type_id: data.expense_type_id,
    date: data.date,
    total: expenseType.total,
  });
};

export const getAllExpenseRecords = async (userId) => {
  return await repository.findAllByUserId(userId);
};

export const getExpenseRecordById = async (id, userId) => {
  const record = await repository.findById(id, userId);

  if (!record) {
    throw new AppError(
      "Expense record not found",
      HTTP_STATUS.NOT_FOUND
    );
  }

  return record;
};

export const updateExpenseRecord = async (
  id,
  userId,
  data
) => {
  const expenseType = await expenseTypeRepository.findById(
    data.expense_type_id,
    userId
  );

  if (!expenseType) {
    throw new AppError(
      "Expense type not found",
      HTTP_STATUS.NOT_FOUND
    );
  }

  const record = await repository.update(
    id,
    userId,
    {
      expense_type_id: data.expense_type_id,
      date: data.date,
      total: expenseType.total,
    }
  );

  if (!record) {
    throw new AppError(
      "Expense record not found",
      HTTP_STATUS.NOT_FOUND
    );
  }

  return record;
};

export const deleteExpenseRecord = async (
  id,
  userId
) => {
  const record = await repository.remove(id, userId);

  if (!record) {
    throw new AppError(
      "Expense record not found",
      HTTP_STATUS.NOT_FOUND
    );
  }

  return record;
};