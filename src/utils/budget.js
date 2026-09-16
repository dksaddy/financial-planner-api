/**
 * Calculates a user's spending budget from their salary, active saving
 * commitments and working days. This is the single source of truth for
 * "how much am I allowed to spend" — used by both the dashboard summary and
 * the Extra Saving feature, so they never disagree.
 *
 * The working days are the user's own (`users.working_days_per_month` and
 * `users.working_days_per_week`), never a constant.
 */
export const calculateBudget = ({
  salary,
  weeklySaving,
  monthlySaving,
  workingDaysPerMonth,
  workingDaysPerWeek,
}) => {
  const totalMonthlySaving =
    weeklySaving * 4 + monthlySaving;

  const monthlySpending = salary - totalMonthlySaving;

  const dailyBudget =
    monthlySpending / workingDaysPerMonth;

  const weeklyBudget =
    dailyBudget * workingDaysPerWeek;

  return {
    totalMonthlySaving,
    monthlySpending,
    dailyBudget,
    weeklyBudget,
  };
};
