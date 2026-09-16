// Every length and range the validation schemas enforce, written once. The
// messages that quote a limit are functions of it, so each schema passes the
// same constant to the rule and to its message.
//
// `financial-planner-web/src/constants/limits.js` mirrors this file — change
// both together.

// One rule for every name the API stores: a person, a saving plan, an expense
// type, a target.
export const NAME_MIN = 2;
export const NAME_MAX = 100;

// A password being chosen. A password being re-typed for confirmation is
// checked for presence only — see `savingPlans.validation.js`.
export const PASSWORD_MIN = 8;

// `GET /expense-records` paging. Capped so a client cannot ask for the whole
// table in one request.
export const PAGE_MIN = 1;
export const LIMIT_MIN = 1;
export const LIMIT_MAX = 100;

// Days a user spreads their spending over. A week cannot hold more working
// days than the month it sits in. The users table's check constraints repeat
// these bounds (migration 014).
export const WORKING_DAYS_PER_MONTH_MIN = 1;
export const WORKING_DAYS_PER_MONTH_MAX = 31;
export const WORKING_DAYS_PER_WEEK_MIN = 1;
export const WORKING_DAYS_PER_WEEK_MAX = 7;

// A saving plan's tax on profit, as a percent. The default applies when a new
// plan is created without one, and is the saving_plans column default too
// (migration 015).
export const TAX_RATE_MIN = 0;
export const TAX_RATE_MAX = 100;
export const DEFAULT_TAX_RATE = 15;
