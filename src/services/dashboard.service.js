import * as repository from "../repositories/dashboard.repository.js";

export const getDashboardData = async (userId) => {
  const [summary, pendingTargets] = await Promise.all([
    repository.getDashboardSummary(userId),
    repository.getPendingTargets(userId),
  ]);

  const salary = Number(summary.salary);

  const totalDeposit = Number(summary.total_deposit);

  const totalWithdrawal = Number(summary.total_withdrawal);

  const weeklySaving = Number(summary.weekly_saving);

  const monthlySaving = Number(summary.monthly_saving);

  const profit = totalWithdrawal - totalDeposit;

  const totalMonthlySaving =
    weeklySaving * 4 + monthlySaving;

  const monthlySpending =
    salary - totalMonthlySaving;

  const dailySpending =
    monthlySpending / 26;

  const weeklySpending =
    dailySpending * 6;

  const totalTargetAmount = pendingTargets.reduce(
    (sum, target) => sum + Number(target.target_amount),
    0
  );

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
  };
};