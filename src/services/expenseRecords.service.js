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

  const record = await repository.create(userId, {
    expense_type_id: data.expense_type_id,
    date: data.date,
    total: expenseType.total,
  });

  await extraSavingsService.recalculateDayExtraSaving(
    userId,
    data.date
  );

  return withNormalizedDate(record);
};

export const getAllExpenseRecords = async (userId) => {
  const records = await repository.findAllByUserId(userId);
  return records.map(withNormalizedDate);
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