// Every word the API uses for a resource's state. The column's check
// constraint is the real authority in each case; this is the one place the
// JavaScript spells them, so a Zod enum, a service rule and a response message
// cannot drift apart or outlive a rename. The STATUS_CHANGED maps in
// `messages.js` are keyed off these.
//
// SQL stays literal — a status inside a query is not a comparison this file can
// own. Renaming a status therefore also means `dashboard.repository.js`,
// `savingPlans.repository.js` and `targets.repository.js`.
//
// Expense records have no status: one record per day, and it either exists or
// it does not.

// active → completed → withdrawn (migration 013 retired `cancelled`). Which
// moves are legal is a service rule — `assertStatusTransition` in
// `savingPlans.service.js`.
export const SAVING_PLAN_STATUS = {
  ACTIVE: "active",
  COMPLETED: "completed",
  WITHDRAWN: "withdrawn",
};

export const SAVING_PLAN_STATUSES = Object.values(SAVING_PLAN_STATUS);

// Expense types are stored as the boolean `is_active`, but the API talks about
// them in words: `GET /expense-types?status=` filters on these and the status
// response says which one the type landed in.
export const EXPENSE_TYPE_STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
};

// `all` is a filter value only — no type is ever in it.
export const EXPENSE_TYPE_STATUS_FILTER = {
  ...EXPENSE_TYPE_STATUS,
  ALL: "all",
};

export const EXPENSE_TYPE_STATUS_FILTERS = Object.values(
  EXPENSE_TYPE_STATUS_FILTER
);

// The bridge between the column and the vocabulary: every place that turns an
// `is_active` into a word goes through here rather than writing its own
// ternary, which is what let the status message and the filter disagree.
export const expenseTypeStatusOf = (isActive) =>
  isActive
    ? EXPENSE_TYPE_STATUS.ACTIVE
    : EXPENSE_TYPE_STATUS.INACTIVE;

// A completed target's amount is subtracted from total extra save, which is
// why `targets.repository.js` filters on the completed value in SQL.
export const TARGET_STATUS = {
  PENDING: "pending",
  COMPLETED: "completed",
};

export const TARGET_STATUSES = Object.values(TARGET_STATUS);
