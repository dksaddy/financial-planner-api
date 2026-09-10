import * as repository from "../repositories/expenseRecords.repository.js";
import * as expenseTypeRepository from "../repositories/expenseTypes.repository.js";
import * as extraSavingsService from "./extraSavings.service.js";
import { toDateString } from "../utils/date.js";

import AppError from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

// Belt-and-braces: guarantee every record leaving this service has a
// plain "YYYY-MM-DD" `date` string, regardless of whether it arrived
// as a string (already fixed at the pg layer) or, if that ever
// regresses, as a timezone-sensitive JS Date object. Never trust a
// `date` column value on its way out without passing it through this.
const withNormalizedDate = (record) =>
  record ? { ...record, date: toDateString(record.date) } : record;

// expense_records carries unique (user_id, date) — one record per day. Postgres
// reports the clash as 23505, which the error middleware would otherwise turn
// into a generic 500 because it is not an AppError.
const asDateTakenError = (error) => {
  if (error?.code === "23505") {
    return new AppError(
      "An expense record already exists for that date.",
      HTTP_STATUS.CONFLICT
    );
  }

  return error;
};

// Expense types are deactivated instead of deleted, and a deactivated
// type must not back any new or re-pointed record.
const loadActiveExpenseType = async (expenseTypeId, userId) => {
  const expenseType = await expenseTypeRepository.findById(
    expenseTypeId,
    userId
  );

  if (!expenseType) {
    throw new AppError(
      "Expense type not found",
      HTTP_STATUS.NOT_FOUND
    );
  }

  if (!expenseType.is_active) {
    throw new AppError(
      "Expense type is inactive",
      HTTP_STATUS.BAD_REQUEST
    );
  }

  return expenseType;
};

export const createExpenseRecord = async (userId, data) => {
  const expenseType = await loadActiveExpenseType(
    data.expense_type_id,
    userId
  );

  let record;

  try {
    record = await repository.create(userId, {
      expense_type_id: data.expense_type_id,
      date: data.date,
      total: expenseType.total,
    });
  } catch (error) {
    throw asDateTakenError(error);
  }

  await extraSavingsService.recalculateDayExtraSaving(
    userId,
    data.date
  );

  return withNormalizedDate(record);
};

// Paginated list. `summary` and `months` describe the whole filtered set
// and the user's full history respectively, so the caller can render an
// accurate header and month filter without holding every record.
export const getAllExpenseRecords = async (
  userId,
  { page = 1, limit = 10, month } = {}
) => {
  const [summary, months] = await Promise.all([
    repository.summarizeByUserId(userId, { month }),
    repository.findMonthsByUserId(userId),
  ]);

  const total = Number(summary.total);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  // A page past the end returns the last page rather than an empty list:
  // deleting the final record of the last page would otherwise strand the
  // client on a page that no longer exists.
  const currentPage = Math.min(page, totalPages);

  const records = await repository.findPageByUserId(userId, {
    limit,
    offset: (currentPage - 1) * limit,
    month,
  });

  return {
    records: records.map(withNormalizedDate),
    pagination: {
      page: currentPage,
      limit,
      total,
      totalPages,
      hasPrevious: currentPage > 1,
      hasNext: currentPage < totalPages,
    },
    summary: {
      total_amount: summary.total_amount,
    },
    months,
  };
};

export const getExpenseRecordById = async (id, userId) => {
  const record = await repository.findById(id, userId);

  if (!record) {
    throw new AppError(
      "Expense record not found",
      HTTP_STATUS.NOT_FOUND
    );
  }

  return withNormalizedDate(record);
};

export const updateExpenseRecord = async (
  id,
  userId,
  data
) => {
  const existing = await repository.findById(id, userId);

  if (!existing) {
    throw new AppError(
      "Expense record not found",
      HTTP_STATUS.NOT_FOUND
    );
  }

  const expenseType = await loadActiveExpenseType(
    data.expense_type_id,
    userId
  );

  let record;

  try {
    record = await repository.update(
      id,
      userId,
      {
        expense_type_id: data.expense_type_id,
        date: data.date,
        total: expenseType.total,
      }
    );
  } catch (error) {
    throw asDateTakenError(error);
  }

  if (!record) {
    throw new AppError(
      "Expense record not found",
      HTTP_STATUS.NOT_FOUND
    );
  }

  // Recalculate the new date always. If the date was changed,
  // also recalculate the old date — it no longer includes this
  // record's amount, so its extra save figure has changed too.
  const oldDate = toDateString(existing.date);
  const newDate = toDateString(data.date);

  await extraSavingsService.recalculateDayExtraSaving(
    userId,
    newDate
  );

  if (oldDate !== newDate) {
    await extraSavingsService.recalculateDayExtraSaving(
      userId,
      oldDate
    );
  }

  return withNormalizedDate(record);
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

  await extraSavingsService.recalculateDayExtraSaving(
    userId,
    toDateString(record.date)
  );

  return record;
};