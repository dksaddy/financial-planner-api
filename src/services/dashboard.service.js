import * as repository from "../repositories/dashboard.repository.js";

export const getDashboardData = async (userId) => {
  const [
    summary,
    pendingTargets,
    topExpenses,
    currentWeekExpenses,
    lastFourWeeksExpenses,
  ] = await Promise.all([
    repository.getDashboardSummary(userId),
    repository.getPendingTargets(userId),
    repository.getTopExpenseTypes(userId),
    repository.getCurrentWeekExpenses(userId),
    repository.getLastFourWeeksExpenses(userId),
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

  const totalMonthlySaving =
    weeklySaving * 4 + monthlySaving;

  // ============================
  // Spending
  // ============================

  const monthlySpending =
    salary - totalMonthlySaving;

  const dailySpending =
    monthlySpending / 26;

  // Saturday → Thursday = 6 days
  const weeklySpending =
    dailySpending * 6;

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
  // Current Week Expense
  // ============================

  const weeklyExpenseTotal =
    currentWeekExpenses.reduce(
      (sum, expense) =>
        sum + Number(expense.total),
      0
    );

  // ============================
  // Previous 4 Weeks Expense
  // ============================

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
    },

    spending: {
      salary,
      monthly: Number(monthlySpending.toFixed(2)),
      weekly: Number(weeklySpending.toFixed(2)),
      daily: Number(dailySpending.toFixed(2)),
    },

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
        records: currentWeekExpenses,
      },

      lastFourWeeks: weeklyExpenses,
    },
  };
};