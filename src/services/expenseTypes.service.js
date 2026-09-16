import * as repository from "../repositories/expenseTypes.repository.js";
import AppError from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { EXPENSE_TYPE_MESSAGES } from "../constants/messages.js";
import {
  EXPENSE_TYPE_STATUS_FILTER,
  EXPENSE_TYPE_STATUS_FILTERS,
} from "../constants/status.js";
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

export const getAllExpenseTypes = async (
  userId,
  status = EXPENSE_TYPE_STATUS_FILTER.ALL
) => {
  if (!EXPENSE_TYPE_STATUS_FILTERS.includes(status)) {
    throw new AppError(
      EXPENSE_TYPE_MESSAGES.INVALID_STATUS_FILTER,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  const isActive =
    status === EXPENSE_TYPE_STATUS_FILTER.ALL
      ? undefined
      : status === EXPENSE_TYPE_STATUS_FILTER.ACTIVE;

  return await repository.findAllByUserId(userId, isActive);
};

export const getExpenseTypeById = async (id, userId) => {
  const expenseType = await repository.findById(id, userId);

  if (!expenseType) {
    throw new AppError(EXPENSE_TYPE_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  return expenseType;
};

// Editing is limited to reshaping the categories and renaming the type.
// The total is frozen: expense_records copy it at creation time, so
// changing it here would silently desync every historical record.
export const updateExpenseType = async (id, userId, data) => {
  const existing = await repository.findById(id, userId);

  if (!existing) {
    throw new AppError(EXPENSE_TYPE_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  const total = calculateExpenseTotal(data.categories);

  if (toCents(total) !== toCents(existing.total)) {
    throw new AppError(
      EXPENSE_TYPE_MESSAGES.TOTAL_MUST_REMAIN(
        Number(existing.total).toFixed(2)
      ),
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
    throw new AppError(EXPENSE_TYPE_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  const deleted = await repository.removeIfUnused(id, userId);

  // The row exists and belongs to this user, so the only reason the guarded
  // delete matched nothing is that an expense record still references it.
  if (!deleted) {
    throw new AppError(
      EXPENSE_TYPE_MESSAGES.IN_USE,
      HTTP_STATUS.CONFLICT
    );
  }

  return deleted;
};

export const setExpenseTypeStatus = async (id, userId, isActive) => {
  const expenseType = await repository.updateStatus(id, userId, isActive);

  if (!expenseType) {
    throw new AppError(EXPENSE_TYPE_MESSAGES.NOT_FOUND, HTTP_STATUS.NOT_FOUND);
  }

  return expenseType;
};
