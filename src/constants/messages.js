import {
  EXPENSE_TYPE_STATUS,
  EXPENSE_TYPE_STATUS_FILTERS,
  SAVING_PLAN_STATUS,
  SAVING_PLAN_STATUSES,
} from "./status.js";

// A line that carries a value is a function of it. That includes every length
// and range rule: the schema passes the same constant from `limits.js` to the
// rule and to its message, so the message cannot quote a stale number.
//
// No line ends with a full stop.

export const COMMON_MESSAGES = {
  VALIDATION_FAILED: "Validation failed",

  INTERNAL_SERVER_ERROR: "Internal Server Error",

  NOT_FOUND: "Resource not found",

  // The catch-all route. Names the path that missed, so it is a function of it.
  ROUTE_NOT_FOUND: (url) => `Route ${url} not found`,

  // The root route's banner — the only response body that is not an
  // ApiResponse.
  API_ROOT: "Financial Planner API",

  // A plain Error, not an AppError: the client gets the generic 500 and this
  // line only ever reaches the server log.
  CORS_BLOCKED: "Not allowed by CORS",

  // Field rules shared by every resource, so the same field reads the same
  // wherever it is submitted.
  VALIDATION: {
    NAME_MIN: (min) => `Name must be at least ${min} characters`,
    NAME_MAX: (max) => `Name cannot exceed ${max} characters`,
    EMAIL_INVALID: "Invalid email address",
    PASSWORD_MIN: (min) => `Password must be at least ${min} characters`,
    PASSWORD_REQUIRED: "Password is required",
  },
};

export const AUTH_MESSAGES = {
  REGISTER_SUCCESS: "User registered successfully",
  LOGIN_SUCCESS: "Login successful",
  LOGOUT_SUCCESS: "Logged out successfully",
  CURRENT_USER: "Current user",

  EMAIL_EXISTS: "Email already exists",
  INVALID_CREDENTIALS: "Invalid email or password",

  AUTH_REQUIRED: "Authentication required",
  INVALID_TOKEN: "Invalid or expired token",
  USER_NOT_FOUND: "User not found",

  // The login/register limiter. Deliberately vaguer than
  // TOO_MANY_PASSWORD_ATTEMPTS below: that one answers a caller who is already
  // signed in, this one must not confirm an account exists.
  TOO_MANY_ATTEMPTS: "Too many attempts. Please try again later",

  // Re-authentication: the caller is signed in, but this action asks them to
  // prove the password again. Deliberately does not say whether the account
  // or the password was the problem.
  PASSWORD_INCORRECT: "Incorrect password",
  TOO_MANY_PASSWORD_ATTEMPTS:
    "Too many incorrect passwords. Please try again later",
};

export const USER_MESSAGES = {
  VALIDATION: {
    SALARY_NEGATIVE: "Salary cannot be negative",
    AVATAR_URL_INVALID: "Invalid avatar URL",
    NOTHING_TO_UPDATE: "At least one field is required",

    PHOTO_REQUIRED: "Photo is required",

    // The old and new passwords use COMMON_MESSAGES.VALIDATION; only the
    // confirmation needs a line of its own.
    CONFIRM_PASSWORD_REQUIRED: "Confirm password is required",
    PASSWORDS_DIFFER: "Passwords do not match",
  },

  PROFILE_FETCHED: "Profile fetched successfully",
  PROFILE_UPDATED: "Profile updated successfully",
  PASSWORD_UPDATED: "Password updated successfully",

  AVATAR_UPDATED: "Avatar updated successfully",
  AVATARS_FETCHED: "Avatars fetched successfully",
  AVATAR_SELECTED: "Profile photo updated successfully",
  AVATAR_DELETED: "Photo deleted successfully",

  AVATAR_REQUIRED: "Avatar image is required",
  // A file name that could climb out of the user's own folder. Raised by both
  // `selectAvatarSchema` and `resolveAvatarPath` in the service, so the client
  // reads the same line whichever layer catches it.
  AVATAR_INVALID: "Invalid image",
  AVATAR_NOT_FOUND: "Image not found",
  AVATAR_IN_USE:
    "This is your current profile picture. Upload a new photo before deleting it",

  OLD_PASSWORD_INCORRECT: "Old password is incorrect",
};

export const DASHBOARD_MESSAGES = {
  FETCHED: "Dashboard fetched successfully",
};

// Raised by `upload.middleware.js` and `utils/image.js` — the two places a file
// is refused before any service sees it.
export const UPLOAD_MESSAGES = {
  UNSUPPORTED_TYPE:
    "Only JPG, PNG, WEBP and GIF images are allowed",
  UNPROCESSABLE:
    "That image could not be processed. Try another file",
};

export const SAVING_PLAN_MESSAGES = {
  VALIDATION: {
    AMOUNT_POSITIVE: "Amount must be greater than 0",
    FREQUENCY_INTEGER: "Frequency must be a whole number",
    FREQUENCY_POSITIVE: "Frequency must be greater than 0",
    MONTHS_INTEGER: "Months must be a whole number",
    MONTHS_POSITIVE: "Months must be greater than 0",
    DEPOSIT_FREQUENCY_INTEGER: "Deposit frequency must be a whole number",
    DEPOSIT_FREQUENCY_POSITIVE: "Deposit frequency must be greater than 0",
    // The plan's deposit target on create — not a single deposit, which is
    // DEPOSIT_AMOUNT_POSITIVE below.
    DEPOSIT_TARGET_NEGATIVE: "Deposit amount cannot be negative",
    WITHDRAWAL_AMOUNT_NEGATIVE: "Withdrawal amount cannot be negative",
    DEPOSIT_AMOUNT_POSITIVE: "Deposit amount must be greater than 0",

    // Spelled out from SAVING_PLAN_STATUSES rather than typed again, so adding
    // a status cannot leave the error naming only the old ones.
    STATUS_INVALID: `Status must be ${SAVING_PLAN_STATUSES.slice(0, -1).join(
      ", "
    )} or ${SAVING_PLAN_STATUSES.at(-1)}`,
  },

  CREATED: "Saving plan created successfully",
  FETCHED: "Saving plans fetched successfully",
  FETCHED_ONE: "Saving plan fetched successfully",
  UPDATED: "Saving plan updated successfully",
  DELETED: "Saving plan deleted successfully",
  NOT_FOUND: "Saving plan not found",

  // One line per status, keyed by the stored value. A map rather than a
  // sentence built around the status: `Saving plan marked ${status}` read as
  // "marked active" when a plan was reopened, and would have shipped whatever
  // the column happened to be called if a status were ever added. Keyed off
  // SAVING_PLAN_STATUS so a rename there is a syntax-level change here, and a
  // new status is a missing line rather than a wrong sentence.
  STATUS_CHANGED: {
    [SAVING_PLAN_STATUS.ACTIVE]: "Saving plan set to active",
    [SAVING_PLAN_STATUS.COMPLETED]: "Saving plan set to completed",
    [SAVING_PLAN_STATUS.WITHDRAWN]: "Saving plan set to withdrawn",
  },

  // The transition rules `assertStatusTransition` enforces.
  STATUS_FINAL: "A withdrawn saving plan cannot change status",
  WITHDRAW_NEEDS_COMPLETED:
    "Only a completed saving plan can be withdrawn",
  REOPEN_NEEDS_REMAINING:
    "A fully deposited saving plan cannot be reopened",

  DEPOSIT_ADDED: "Deposit added successfully",
  DEPOSIT_COMPLETED: "Deposit added, saving plan completed",
  DEPOSIT_NEEDS_ACTIVE:
    "Deposits can only be added to active saving plans",

  // Carries the figure the caller has left to deposit, so it is a function of
  // that amount rather than a fixed line.
  DEPOSIT_EXCEEDS_REMAINING: (remaining) =>
    `Deposit exceeds the remaining ${remaining}`,

  // The guarded UPDATE matched no row: someone else moved the plan between the
  // read and the write.
  STATUS_CHANGED_MEANWHILE:
    "Saving plan status changed meanwhile, try again",
  CHANGED_MEANWHILE: "Saving plan changed meanwhile, try again",
};

export const EXPENSE_TYPE_MESSAGES = {
  VALIDATION: {
    CATEGORY_NAME_REQUIRED: "Category name is required",
    CATEGORY_AMOUNT_POSITIVE: "Amount must be greater than 0",
    CATEGORIES_REQUIRED: "At least one category is required",
    IS_ACTIVE_BOOLEAN: "is_active must be a boolean",
  },

  CREATED: "Expense type created successfully",
  FETCHED: "Expense types fetched successfully",
  FETCHED_ONE: "Expense type fetched successfully",
  UPDATED: "Expense type updated successfully",
  DELETED: "Expense type deleted successfully",
  NOT_FOUND: "Expense type not found",

  // One line per state a type can be in, keyed by the word the status filter
  // uses for it. Built from the same constants as the filter so the two cannot
  // describe the same type differently.
  STATUS_CHANGED: {
    [EXPENSE_TYPE_STATUS.ACTIVE]: "Expense type activated successfully",
    [EXPENSE_TYPE_STATUS.INACTIVE]:
      "Expense type deactivated successfully",
  },

  // Listed from the filter values rather than typed again: "active, inactive,
  // all".
  INVALID_STATUS_FILTER: `Status must be one of: ${EXPENSE_TYPE_STATUS_FILTERS.join(
    ", "
  )}`,

  // A type's total is frozen after creation, because expense records snapshot
  // it — so an update must still add up to the stored figure.
  TOTAL_MUST_REMAIN: (total) => `Total amount must remain ${total}`,

  IN_USE:
    "This expense type is used by existing expense records. Deactivate it instead",

  INACTIVE: "Expense type is inactive",
};

export const EXPENSE_RECORD_MESSAGES = {
  VALIDATION: {
    EXPENSE_TYPE_ID_INVALID: "Invalid expense type id",
    DATE_INVALID: "Invalid date",

    // The list query. Strings on the way in, hence the coercion messages.
    PAGE_NUMBER: "Page must be a number",
    PAGE_INTEGER: "Page must be a whole number",
    PAGE_MIN: (min) => `Page must be at least ${min}`,
    LIMIT_NUMBER: "Limit must be a number",
    LIMIT_INTEGER: "Limit must be a whole number",
    LIMIT_MIN: (min) => `Limit must be at least ${min}`,
    LIMIT_MAX: (max) => `Limit cannot exceed ${max}`,
    MONTH_FORMAT: "Month must be in YYYY-MM format",
  },

  CREATED: "Expense record created successfully",
  FETCHED: "Expense records fetched successfully",
  FETCHED_ONE: "Expense record fetched successfully",
  UPDATED: "Expense record updated successfully",
  DELETED: "Expense record deleted successfully",
  NOT_FOUND: "Expense record not found",

  // `expense_records` carries unique (user_id, date) — one record per day.
  DATE_TAKEN: "An expense record already exists for that date",
};

export const TARGET_MESSAGES = {
  VALIDATION: {
    AMOUNT_POSITIVE: "Target amount must be greater than 0",
  },

  CREATED: "Target created successfully",
  FETCHED: "Targets fetched successfully",
  FETCHED_ONE: "Target fetched successfully",
  UPDATED: "Target updated successfully",
  DELETED: "Target deleted successfully",
  NOT_FOUND: "Target not found",
};

// Every status needs its STATUS_CHANGED line. Checked once at import, so a
// status added to `status.js` without one stops the app from starting instead
// of answering a status change with no message.
const assertEveryStatusHasALine = (group, lines, statuses) => {
  const missing = statuses.filter((status) => !lines[status]);

  if (missing.length) {
    throw new Error(
      `${group}.STATUS_CHANGED has no line for: ${missing.join(", ")}`
    );
  }
};

assertEveryStatusHasALine(
  "SAVING_PLAN_MESSAGES",
  SAVING_PLAN_MESSAGES.STATUS_CHANGED,
  SAVING_PLAN_STATUSES
);

assertEveryStatusHasALine(
  "EXPENSE_TYPE_MESSAGES",
  EXPENSE_TYPE_MESSAGES.STATUS_CHANGED,
  Object.values(EXPENSE_TYPE_STATUS)
);
