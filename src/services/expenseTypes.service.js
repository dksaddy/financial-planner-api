import * as repository from "../repositories/expenseTypes.repository.js";
import AppError from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { calculateExpenseTotal } from "../utils/calculation.js";

// `total` is numeric(10,2) in the database and a float in JS, so compare
// the two as integer cents rather than trusting float equality.
const toCents = (amount) => Math.round(Number(amount) * 100);

export const createExpenseType = async (userId, data) => {
  const total = calculateExpenseTotal(data.categories);

  return await repository.create(userId, {
    ...data,
    total,
  });
};

export const getAllExpenseTypes = async (userId, status = "all") => {
  if (!["active", "inactive", "all"].includes(status)) {
    throw new AppError(
      "Status must be one of: active, inactive, all",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const isActive = status === "all" ? undefined : status === "active";

  return await repository.findAllByUserId(userId, isActive);
};

export const getExpenseTypeById = async (id, userId) => {
  const expenseType = await repository.findById(id, userId);

  if (!expenseType) {
    throw new AppError("Expense type not found", HTTP_STATUS.NOT_FOUND);
  }

  return expenseType;
};

// Editing is limited to reshaping the categories and renaming the type.
// The total is frozen: expense_records copy it at creation time, so
// changing it here would silently desync every historical record.
export const updateExpenseType = async (id, userId, data) => {
  const existing = await repository.findById(id, userId);

  if (!existing) {
    throw new AppError("Expense type not found", HTTP_STATUS.NOT_FOUND);
  }

  const total = calculateExpenseTotal(data.categories);

  if (toCents(total) !== toCents(existing.total)) {
    throw new AppError(
      `Total amount must remain ${Number(existing.total).toFixed(2)}`,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  return await repository.update(id, userId, data);
};

// Deletable only while nothing points at it. Once a record exists the type is
// part of that record's history — and the foreign key would cascade the
// records away with it — so deactivating is the only option from then on.
export const deleteExpenseType = async (id, userId) => {
  const existing = await repository.findById(id, userId);

  if (!existing) {
    throw new AppError("Expense type not found", HTTP_STATUS.NOT_FOUND);
  }

  const deleted = await repository.removeIfUnused(id, userId);

  // The row exists and belongs to this user, so the only reason the guarded
  // delete matched nothing is that an expense record still references it.
  if (!deleted) {
    throw new AppError(
      "This expense type is used by existing expense records. Deactivate it instead.",
      HTTP_STATUS.CONFLICT
    );
  }

  return deleted;
};

export const setExpenseTypeStatus = async (id, userId, isActive) => {
  const expenseType = await repository.updateStatus(id, userId, isActive);

  if (!expenseType) {
    throw new AppError("Expense type not found", HTTP_STATUS.NOT_FOUND);
  }

  return expenseType;
};
