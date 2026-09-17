import * as dashboardRepository from "../repositories/dashboard.repository.js";
import * as expenseRecordsRepository from "../repositories/expenseRecords.repository.js";
import * as dailyExtraSavingsRepository from "../repositories/dailyExtraSavings.repository.js";
import * as targetsRepository from "../repositories/targets.repository.js";
import { calculateBudget } from "../utils/budget.js";

const currentDailyBudget = async (userId) => {
  const summary = await dashboardRepository.getDashboardSummary(
    userId
  );

  const { dailyBudget } = calculateBudget({
    salary: Number(summary.salary),
    weeklySaving: Number(summary.weekly_saving),
    monthlySaving: Number(summary.monthly_saving),
    workingDaysPerMonth: Number(summary.working_days_per_month),
    workingDaysPerWeek: Number(summary.working_days_per_week),
  });

  return Number(dailyBudget.toFixed(2));
};

/**
 * Recalculates and persists the Extra Save figure for a single day.
 * Call this any time an expense record is created, updated, or
 * deleted for that date, so the stored figure never goes stale.
 *
 * A day left with no records at all has its row removed rather than
 * recalculated. Keeping it would bank a full day's budget as extra saving
 * for a day the user never recorded anything on — which is what deleting
 * the last record of a day used to do, silently inflating the total.
 */
export const recalculateDayExtraSaving = async (
  userId,
  date
) => {
  const { count, total: spentAmount } =
    await expenseRecordsRepository.summarizeDay(userId, date);

  if (count === 0) {
    await dailyExtraSavingsRepository.removeForDate(userId, date);

    return null;
  }

  // A day keeps the budget it was first written with. Salary, working days
  // and saving plans rewrite no stored day, so re-basing only the day whose
  // record happened to be edited would leave a month mixing budgets for no
  // reason the user could see. Today's budget is read only for a day that has
  // no row yet.
  const [stored] = await dailyExtraSavingsRepository.findByDates(
    userId,
    [date]
  );

  const budgetAmount = stored
    ? Number(stored.budget_amount)
    : await currentDailyBudget(userId);

  return await dailyExtraSavingsRepository.upsertForDate(
    userId,
    date,
    {
      budgetAmount,
      spentAmount: Number(spentAmount.toFixed(2)),
    }
  );
};

/**
 * Total Extra Save = everything saved across all recorded days,
 * minus whatever has been spent completing targets.
 */
export const getTotalExtraSave = async (userId) => {
  const [totalFromDays, totalDeductedByTargets] =
    await Promise.all([
      dailyExtraSavingsRepository.getTotalExtraSave(userId),
      targetsRepository.getTotalCompletedAmount(userId),
    ]);

  const totalExtraSave =
    totalFromDays - totalDeductedByTargets;

  return {
    totalExtraSave: Number(totalExtraSave.toFixed(2)),
    totalDeductedByTargets: Number(
      totalDeductedByTargets.toFixed(2)
    ),
  };
};