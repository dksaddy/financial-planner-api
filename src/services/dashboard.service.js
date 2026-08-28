import * as repository from "../repositories/dashboard.repository.js";
import * as dailyExtraSavingsRepository from "../repositories/dailyExtraSavings.repository.js";
import * as extraSavingsService from "./extraSavings.service.js";
import { calculateBudget } from "../utils/budget.js";
import { toDateString } from "../utils/date.js";

export const getDashboardData = async (userId) => {
  const [
    summary,
    savingPlans,
    pendingTargets,
    topExpenses,
    currentWeekExpenses,
    lastFourWeeksExpenses,
    extraSaving,
  ] = await Promise.all([
    repository.getDashboardSummary(userId),
    repository.getSavingPlans(userId),
    repository.getPendingTargets(userId),
    repository.getTopExpenseTypes(userId),
    repository.getCurrentWeekExpenses(userId),
    repository.getLastFourWeeksExpenses(userId),
    extraSavingsService.getTotalExtraSave(userId),
  ]);

  // ============================
  // Saving
  // ============================

  const salary = Number(summary.salary);

  const totalDeposit = Number(summary.total_deposit);

  const totalWithdrawal = Number(summary.total_withdrawal);

  const weeklySaving = Number(summary.weekly_saving);

  const monthlySaving = Number(summary.monthly_saving);

  const profit = totalWithdrawal - totalDeposit;

  const savingPlanProgress = savingPlans.map((plan) => {
    const depositAmount = Number(plan.deposit_amount);
    const currentlyDeposited = Number(plan.currently_deposited);
    const remaining = Math.max(depositAmount - currentlyDeposited, 0);

    const percentage =
      depositAmount > 0
        ? Math.min((currentlyDeposited / depositAmount) * 100, 100)
        : 0;

    return {
      id: plan.id,
      name: plan.name,
      status: plan.status,
      amount: Number(plan.amount),
      frequency: Number(plan.frequency),
      months: Number(plan.months),
      depositAmount,
      depositFrequency: Number(plan.deposit_frequency),
      currentlyDeposited,
      withdrawalAmount: Number(plan.withdrawal_amount),
      profit: Number(
        (Number(plan.withdrawal_amount) - depositAmount).toFixed(2)
      ),
      remaining: Number(remaining.toFixed(2)),
      percentage: Number(percentage.toFixed(2)),
      createdAt: plan.created_at,
    };
  });

  // ============================
  // Spending (shared with Extra Saving's daily budget)
  // ============================

  const {
    totalMonthlySaving,
    monthlySpending,
    dailyBudget: dailySpending,
    weeklyBudget: weeklySpending,
  } = calculateBudget({
    salary,
    weeklySaving,
    monthlySaving,
  });

  // ============================
  // Targets
  // ============================

  const totalTargetAmount =
    pendingTargets.reduce(
      (sum, target) =>
        sum + Number(target.target_amount),
      0
    );

  // ============================
  // Current Week Expense + per-day Extra Save
  // ============================

  const weeklyExpenseTotal =
    currentWeekExpenses.reduce(
      (sum, expense) =>
        sum + Number(expense.total),
      0
    );

  // Only look up daily_extra_savings for dates that actually have
  // expense records this week (a day with no expense record has no
  // extra save figure yet — it's only calculated on insert).
  const currentWeekDates = [
    ...new Set(
      currentWeekExpenses.map((expense) =>
        toDateString(expense.date)
      )
    ),
  ].sort();

  let dailySavingsByDate = {};

  if (currentWeekDates.length > 0) {
    const rows = await dailyExtraSavingsRepository.findByDateRange(
      userId,
      currentWeekDates[0],
      currentWeekDates[currentWeekDates.length - 1]
    );

    rows.forEach((row) => {
      dailySavingsByDate[toDateString(row.date)] = Number(
        row.extra_amount
      );
    });
  }

  const currentWeekRecords = currentWeekExpenses.map(
    (expense) => ({
      ...expense,
      extraSave:
        dailySavingsByDate[toDateString(expense.date)] ?? null,
    })
  );

  const currentWeekTotalExtraSave = Object.values(
    dailySavingsByDate
  ).reduce((sum, value) => sum + value, 0);

  // ============================
  // Previous 4 Weeks Expense + per-day Extra Save
  // ============================

  // Same approach as the current week's lookup above: only fetch
  // daily_extra_savings for dates that actually have an expense
  // record in the last four weeks, in one range query.
  const lastFourWeeksDates = [
    ...new Set(
      lastFourWeeksExpenses.map((expense) =>
        toDateString(expense.date)
      )
    ),
  ].sort();

  let lastFourWeeksSavingsByDate = {};

  if (lastFourWeeksDates.length > 0) {
    const rows = await dailyExtraSavingsRepository.findByDateRange(
      userId,
      lastFourWeeksDates[0],
      lastFourWeeksDates[lastFourWeeksDates.length - 1]
    );

    rows.forEach((row) => {
      lastFourWeeksSavingsByDate[toDateString(row.date)] = Number(
        row.extra_amount
      );
    });
  }

  const weeklyExpenses = {
    week1: [],
    week2: [],
    week3: [],
    week4: [],
  };

  lastFourWeeksExpenses.forEach((expense) => {
    const item = {
      id: expense.id,
      date: expense.date,
      total: Number(expense.total),
      typeName: expense.type_name,
      extraSave:
        lastFourWeeksSavingsByDate[
          toDateString(expense.date)
        ] ?? null,
    };

    switch (Number(expense.week_number)) {
      case 1:
        weeklyExpenses.week1.push(item);
        break;

      case 2:
        weeklyExpenses.week2.push(item);
        break;

      case 3:
        weeklyExpenses.week3.push(item);
        break;

      case 4:
        weeklyExpenses.week4.push(item);
        break;

      default:
        break;
    }
  });

  // ============================
  // Response
  // ============================

  return {
    saving: {
      totalDeposit,
      totalWithdrawal,
      profit,
      weeklySaving,
      monthlySaving,
      totalMonthlySaving,
      plans: savingPlanProgress,
    },

    spending: {
      salary,
      monthly: Number(monthlySpending.toFixed(2)),
      weekly: Number(weeklySpending.toFixed(2)),
      daily: Number(dailySpending.toFixed(2)),
    },

    extraSaving,

    targets: {
      totalPendingTargets: pendingTargets.length,
      totalTargetAmount: Number(totalTargetAmount.toFixed(2)),
      pendingTargets,
    },

    expenses: {
      topExpenseTypes: topExpenses.map((expense) => ({
        id: expense.id,
        name: expense.name,
        frequency: Number(expense.frequency),
        totalAmount: Number(expense.total_amount),
      })),

      currentWeek: {
        totalExpense: Number(weeklyExpenseTotal.toFixed(2)),
        totalRecords: currentWeekExpenses.length,
        totalExtraSave: Number(
          currentWeekTotalExtraSave.toFixed(2)
        ),
        records: currentWeekRecords,
      },

      lastFourWeeks: weeklyExpenses,
    },
  };
};