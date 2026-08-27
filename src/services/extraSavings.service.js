import * as dashboardRepository from "../repositories/dashboard.repository.js";
import * as expenseRecordsRepository from "../repositories/expenseRecords.repository.js";
import * as dailyExtraSavingsRepository from "../repositories/dailyExtraSavings.repository.js";
import * as targetsRepository from "../repositories/targets.repository.js";
import { calculateBudget } from "../utils/budget.js";

/**
 * Recalculates and persists the Extra Save figure for a single day.
 * Call this any time an expense record is created, updated, or
 * deleted for that date, so the stored figure never goes stale.
 */
export const recalculateDayExtraSaving = async (
  userId,
  date
) => {
  const summary = await dashboardRepository.getDashboardSummary(
    userId
  );

  const { dailyBudget } = calculateBudget({
    salary: Number(summary.salary),
    weeklySaving: Number(summary.weekly_saving),
    monthlySaving: Number(summary.monthly_saving),
  });

  const spentAmount =
    await expenseRecordsRepository.sumTotalByDate(userId, date);

  return await dailyExtraSavingsRepository.upsertForDate(
    userId,
    date,
    {
      budgetAmount: Number(dailyBudget.toFixed(2)),
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
    totalFromDailySavings: Number(totalFromDays.toFixed(2)),
    totalDeductedByTargets: Number(
      totalDeductedByTargets.toFixed(2)
    ),
  };
};