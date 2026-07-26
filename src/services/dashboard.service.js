import * as repository from "../repositories/dashboard.repository.js";

export const getDashboardData = async (userId) => {
  const summary = await repository.getDashboardSummary(userId);

  const salary = Number(summary.salary);

  const totalDeposit = Number(summary.total_deposit);

  const totalWithdrawal = Number(summary.total_withdrawal);

  const weeklySaving = Number(summary.weekly_saving);

  const monthlySaving = Number(summary.monthly_saving);

  const profit =
    totalWithdrawal - totalDeposit;

  const totalMonthlySaving =
    weeklySaving * 4 +
    monthlySaving;

  const monthlySpending =
    salary -
    totalMonthlySaving;

  const dailySpending =
    monthlySpending / 26;

  const weeklySpending =
    dailySpending * 6;

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
      monthly: monthlySpending,
      weekly: weeklySpending,
      daily: dailySpending,
    },
  };
};