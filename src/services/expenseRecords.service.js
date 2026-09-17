import * as repository from "../repositories/expenseRecords.repository.js";
import * as expenseTypeRepository from "../repositories/expenseTypes.repository.js";
import * as dailyExtraSavingsRepository from "../repositories/dailyExtraSavings.repository.js";
import * as extraSavingsService from "./extraSavings.service.js";
import { todayIn, toDateString, weekRange } from "../utils/date.js";
import { withUserLock } from "../db/query.js";

import AppError from "../utils/AppError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import {
  EXPENSE_RECORD_MESSAGES,
  EXPENSE_TYPE_MESSAGES,
} from "../constants/messages.js";

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
      EXPENSE_RECORD_MESSAGES.DATE_TAKEN,
      HTTP_STATUS.CONFLICT
    );
  }

  return error;
};

// An expense record says what was spent, so it cannot be dated ahead of the
// day it is written on — the user's day, read in their own `time_zone`, not
// the server's. The web reports the browser's zone to the profile, which is
// what makes a strict comparison safe for a user far from the server.
const assertNotFuture = (date, timeZone) => {
  if (toDateString(date) > todayIn(timeZone)) {
    throw new AppError(
      EXPENSE_RECORD_MESSAGES.DATE_IN_FUTURE,
      HTTP_STATUS.BAD_REQUEST
    );
  }
};

// A week holds one record per working day: the user spends on
// `working_days_per_week` days, so a seventh record in a six-day week is
// spending on a day the budget never allowed for. The unique (user_id, date)
// constraint already keeps it to one a day; this keeps the week to the days
// that were budgeted.
//
// `excludeId` is the record being updated — moving a record within its own
// week must not count it against itself.
//
// Callers run this and the write it guards under `withUserLock`, so two creates
// at once take turns and the second one counts the first one's record.
const assertWeekHasRoom = async (user, date, excludeId) => {
  const userId = user.id;

  const [start, end] = weekRange(date);

  const count = await repository.countInWeek(userId, {
    start,
    end,
    excludeId,
  });

  if (count >= user.working_days_per_week) {
    throw new AppError(
      EXPENSE_RECORD_MESSAGES.WEEK_FULL(user.working_days_per_week),
      HTTP_STATUS.BAD_REQUEST
    );
  }
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
      EXPENSE_TYPE_MESSAGES.NOT_FOUND,
      HTTP_STATUS.NOT_FOUND
    );
  }

  if (!expenseType.is_active) {
    throw new AppError(
      EXPENSE_TYPE_MESSAGES.INACTIVE,
      HTTP_STATUS.BAD_REQUEST
    );
  }

  return expenseType;
};

// `user` is `req.user` — it carries the time zone and working days the rules
// below read, so they cost no extra query.
export const createExpenseRecord = async (user, data) => {
  const userId = user.id;

  const expenseType = await loadActiveExpenseType(
    data.expense_type_id,
    userId
  );

  assertNotFuture(data.date, user.time_zone);

  // One transaction under the user's lock: the week count, the insert and the
  // day's Extra Save land together or not at all. A date clash inside it
  // rolls the whole thing back before it is translated to a 409.
  const record = await withUserLock(userId, async () => {
    await assertWeekHasRoom(user, data.date);

    let created;

    try {
      created = await repository.create(userId, {
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

    return created;
  });

  return withNormalizedDate(record);
};

// Paginated list. `summary` and `months` describe the whole filtered set
// and the user's full history respectively, so the caller can render an
// accurate header and month filter without holding every record.
export const getAllExpenseRecords = async (
  userId,
  { page = 1, limit = 10, month } = {}
) => {
  const [summary, months, totalExtraSave] = await Promise.all([
    repository.summarizeByUserId(userId, { month }),
    repository.findMonthsByUserId(userId),
    dailyExtraSavingsRepository.sumExtraAmount(userId, month),
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

  const normalized = records.map(withNormalizedDate);

  // The stored figure for each day on this page, keyed by date. It is read
  // rather than derived because it counts the whole day — a day's records can
  // straddle two pages, and the budget side of the sum is not in this response
  // at all. Days with no row (nothing recorded, so nothing saved) are simply
  // absent, and the client renders them as blank rather than as zero.
  const dates = [...new Set(normalized.map((record) => record.date))];

  const extraSavingRows =
    await dailyExtraSavingsRepository.findByDates(userId, dates);

  const extraSavings = Object.fromEntries(
    extraSavingRows.map((row) => [
      toDateString(row.date),
      {
        budget_amount: row.budget_amount,
        spent_amount: row.spent_amount,
        extra_amount: row.extra_amount,
      },
    ])
  );

  return {
    records: normalized,
    extraSavings,
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
      // Saved across the same filter as total_amount. Can be negative — an
      // overspent month really is a loss against budget.
      total_extra_save: totalExtraSave,
    },
    months,
  };
};

export const getExpenseRecordById = async (id, userId) => {
  const record = await repository.findById(id, userId);

  if (!record) {
    throw new AppError(
      EXPENSE_RECORD_MESSAGES.NOT_FOUND,
      HTTP_STATUS.NOT_FOUND
    );
  }

  return withNormalizedDate(record);
};

export const updateExpenseRecord = async (
  id,
  user,
  data
) => {
  const userId = user.id;

  const existing = await repository.findById(id, userId);

  if (!existing) {
    throw new AppError(
      EXPENSE_RECORD_MESSAGES.NOT_FOUND,
      HTTP_STATUS.NOT_FOUND
    );
  }

  const expenseType = await loadActiveExpenseType(
    data.expense_type_id,
    userId
  );

  assertNotFuture(data.date, user.time_zone);

  const record = await withUserLock(userId, async () => {
    // Checked against the week the record is moving to, which is its own week
    // when only the type or the day changed.
    await assertWeekHasRoom(user, data.date, id);

    let updated;

    try {
      updated = await repository.update(
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

    if (!updated) {
      throw new AppError(
        EXPENSE_RECORD_MESSAGES.NOT_FOUND,
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

    return updated;
  });

  return withNormalizedDate(record);
};

export const deleteExpenseRecord = async (
  id,
  userId
) => {
  // Locked like create and update, so the delete and the day's Extra Save
  // cannot interleave with a target completion reading that total.
  return withUserLock(userId, async () => {
    const record = await repository.remove(id, userId);

    if (!record) {
      throw new AppError(
        EXPENSE_RECORD_MESSAGES.NOT_FOUND,
        HTTP_STATUS.NOT_FOUND
      );
    }

    await extraSavingsService.recalculateDayExtraSaving(
      userId,
      toDateString(record.date)
    );

    return record;
  });
};