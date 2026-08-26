// Working days per month used across the app's spending calculations
// (Saturday-Thursday, Friday excluded) — matches dashboard.service.js.
const WORKING_DAYS_PER_MONTH = 26;
const WORKING_DAYS_PER_WEEK = 6;

/**
 * Calculates a user's spending budget from their salary and active
 * saving commitments. This is the single source of truth for
 * "how much am I allowed to spend" — used by both the dashboard
 * summary and the Extra Saving feature, so they never disagree.
 */
export const calculateBudget = ({
  salary,
  weeklySaving,
  monthlySaving,
}) => {
  const totalMonthlySaving =
    weeklySaving * 4 + monthlySaving;

  const monthlySpending = salary - totalMonthlySaving;

  const dailyBudget =
    monthlySpending / WORKING_DAYS_PER_MONTH;

  const weeklyBudget =
    dailyBudget * WORKING_DAYS_PER_WEEK;

  return {
    totalMonthlySaving,
    monthlySpending,
    dailyBudget,
    weeklyBudget,
  };
};