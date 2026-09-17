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

// What an uploaded picture may be. The web's `constants/limits.js` mirrors
// these, so a picker refuses a file before it is sent and says why.
export const IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

// Size is per upload rather than one figure for every picture: each route
// names its own, and `upload.middleware.js` takes no default, so a new upload
// route has to decide what it will accept.
//
// A target picture is re-encoded to WebP at 1024px before it is stored, so
// what this bounds is the phone photo on its way in, not what is kept.
export const TARGET_IMAGE_MAX_MB = 2;

// Profile pictures. The album is every avatar a user has ever uploaded and
// nothing replaces a file, so without a cap it grows without end — a full
// album has to have a photo deleted before another can go in.
export const AVATAR_MAX = 3;
export const AVATAR_MAX_MB = 3;
