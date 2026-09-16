/**
 * A saving plan's profit, the tax taken from it, and what reaches the user's
 * hand — the withdrawal less that tax. The single source of truth
 * for that maths — the web's `normalizeSavingPlan` mirrors it and must stay in
 * step.
 *
 * Tax is charged per plan and only on a gain: a plan that loses money pays
 * nothing, and its loss does not offset another plan's tax. `taxRate` is a
 * percent, as stored (15 is 15%).
 */
export const calculateProfit = ({
  depositAmount,
  withdrawalAmount,
  taxRate,
}) => {
  const profit = withdrawalAmount - depositAmount;

  const tax = (Math.max(profit, 0) * taxRate) / 100;

  return {
    profit: Number(profit.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    inHand: Number((withdrawalAmount - tax).toFixed(2)),
    netProfit: Number((profit - tax).toFixed(2)),
  };
};
