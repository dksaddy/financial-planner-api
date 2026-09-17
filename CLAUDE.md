# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # nodemon src/server.js
npm start                # production

npm run migrate          # apply pending migrations against .env
npm run prepare:test     # reset + migrate + seed the .env.test database
npm test                 # vitest run against .env.test
npm run test:watch
npm run test:all         # prepare:test then test

npx vitest run tests/savingPlans/create.test.js       # single file
npx vitest run -t "creates a saving plan"             # single test by name
```

Single-test runs still need the test env, so prefix them:
`cross-env ENV_FILE=.env.test NODE_ENV=test npx vitest run <file>` — or just use `npm test -- <file>`,
which forwards args through the configured env.

There is no linter or formatter configured.

## Environment

`src/config/env.js` loads dotenv from `process.env.ENV_FILE || ".env"`. That indirection is the whole
test-isolation mechanism: the `test` scripts set `ENV_FILE=.env.test` so the app connects to a separate
database. Anything reading config must go through `env.js` rather than `process.env` directly (the
Supabase upload paths in `targets.service.js` / `user.service.js` are the existing exceptions — they read
`process.env.SUPABASE_BUCKET`).

## Architecture

Layered, one file per resource per layer, all ESM (`"type": "module"`, always use `.js` in imports):

`routes → middlewares → controllers → services → repositories → src/db/query.js → pg pool`

- **Routes** mount `authenticate` (usually `router.use(authenticate)`) and `validate(schema)` per endpoint.
- **Controllers** are thin: unwrap `req.user.id` / `req.params` / `req.body`, call one service, wrap the
  result in `new ApiResponse(status, message, data)`. Always wrapped in `asyncHandler` so throws reach the
  error middleware.
- **Services** own business rules, ownership checks, and `AppError` throws.
- **Repositories** contain only parameterized SQL and return raw snake_case rows. Every query is scoped by
  `user_id` — that scoping, not a separate authorization layer, is how multi-tenancy is enforced. New
  repository methods must keep taking `userId` and filtering on it.

Pagination: `GET /expense-records` is the reference implementation. Query strings are validated by
`validateQuery(schema)`, which writes the coerced values to **`req.validatedQuery`** — Express 5's
`req.query` is a getter with no setter, so it cannot be replaced in place. `data` stays a plain array
and everything describing the full result set goes in `ApiResponse`'s optional fourth argument, `meta`
(`{ pagination, summary, months, extraSavings }`); `meta` is omitted from the JSON entirely when not
passed, so other endpoints keep their exact shape. `extraSavings` maps `"YYYY-MM-DD"` to that day's
stored `daily_extra_savings` row for the days on the current page — read, never derived from the rows,
because it weighs the day's whole spend against a budget the response does not carry. A day with no
row is absent from the map rather than present as zero. Paged list queries must carry a tiebreaker in the `ORDER BY`
(`date DESC, created_at DESC, id DESC`) or rows shift between pages, and the service clamps a page past
the end to the last page rather than returning an empty list.

Errors: `AppError` sets `isOperational`. `error.middleware.js` only echoes messages from operational
errors; anything else becomes a generic 500 with the real error logged server-side. Validation failures
short-circuit in `validate.middleware.js` with a different shape (`{ success, message, errors[] }` — no
`statusCode`), so tests asserting on validation responses should not expect the `ApiResponse` shape.

## Cross-cutting domain logic

**Messages and statuses** — two files, and nothing else in `src/` types either kind of string.
`src/constants/status.js` holds the status vocabularies: saving plans, expense types plus the `all`
filter value and `expenseTypeStatusOf`, targets (expense records have none). `src/constants/messages.js`
holds one message group per resource: `COMMON_`, `AUTH_`, `USER_`, `DASHBOARD_`, `UPLOAD_`,
`SAVING_PLAN_`, `EXPENSE_TYPE_`, `EXPENSE_RECORD_`, `TARGET_`. Each group nests its Zod field rules
under `VALIDATION`, so a resource's success lines, error lines and field rules sit together. A line
that carries a value is a function (`DEPOSIT_EXCEEDS_REMAINING(remaining)`, `TOTAL_MUST_REMAIN(total)`,
`ROUTE_NOT_FOUND(url)`), and a per-status line is a map keyed off the status constants
(`STATUS_CHANGED`). No message ends with a full stop.

Validation is shared the same way. `src/constants/limits.js` holds every length and range
(`NAME_MIN`/`NAME_MAX` — one rule for every stored name —, `PASSWORD_MIN`, the page/limit bounds), and a
message that quotes one is a function of it, so the rule and the message read the same constant.
`src/validations/fields.js` defines each field more than one schema accepts — `name`, `email`
(trimmed and lower-cased), `newPassword` (a password being chosen: `PASSWORD_MIN`) and
`existingPassword` (a password being re-typed — login, the old password on a change, saving-plan
confirmation: presence only, so validation never reveals the policy and bcrypt gives the verdict).
Their messages live in `COMMON_MESSAGES.VALIDATION`. A resource schema imports these fields rather than
restating them.

Add the constant first — no message or status string belongs in a controller, service, middleware,
validation schema or `app.js`. What stays literal, deliberately: SQL and library error names
(`JsonWebTokenError`). The SQL means renaming a status is more than a `status.js` edit: the check
constraints in `migrations/`, `dashboard.repository.js` (`'active'`, `'withdrawn'`, `'pending'`),
`savingPlans.repository.js` (`addDeposit`'s `'active'` guard and `'completed'`) and
`targets.repository.js` (`status='completed'`) all spell the values too.

**Budget** — `src/utils/budget.js` is the single source of truth for salary → spendable budget:
`salary - (weeklySaving * 4 + monthlySaving)`, divided by the user's `working_days_per_month` for the
daily budget and multiplied by `working_days_per_week` for the weekly one. Both are per-user columns
(migration 014, default 26 and 6), edited through `PUT /users/profile`, bounded by `limits.js` and the
table's check constraints, and a week may not hold more days than its month —
`assertWorkingDaysFit` in `user.service.js` checks that against the stored figure, since an update may
send only one. `getDashboardSummary` reads them alongside salary, and the dashboard echoes them in
`spending`. Both the dashboard and the Extra Saving feature call `calculateBudget`; never recompute a
budget inline, and never pass a literal day count.

Changing working days, like changing salary, does not rewrite stored `daily_extra_savings` rows: each
keeps the budget it was written with, and new figures apply from the next expense-record mutation.

**Extra Saving** — `daily_extra_savings` rows are a *derived cache*, written only on expense-record
mutation. `expenseRecords.service.js` calls `extraSavingsService.recalculateDayExtraSaving(userId, date)`
after every create/update/delete (and for update, for the old date too when the date changed). Any new
path that touches expense records must do the same or the dashboard figures go stale. Total extra save =
sum of daily rows minus completed targets' amounts.

A day left with **no** expense records has its row deleted rather than recalculated — that is why
`summarizeDay` returns a count alongside the sum. Upserting instead would bank a whole day's budget as
extra saving for a day with nothing recorded on it, which is what deleting the last record of a day
used to do. A day whose records genuinely total 0 still keeps its row, hence count rather than sum.

**One expense record per day** — `expense_records` carries unique `(user_id, date)`, matching the
constraint `daily_extra_savings` has had since migration 007, so a day and its derived row are
one-to-one. Postgres reports a clash as `23505`, which is not an `AppError` and would otherwise reach
the client as a generic 500; `asDateTakenError` in `expenseRecords.service.js` translates it to a 409 on
both the create and update paths. Tests must not reuse a date — `nextExpenseDate()` in
`tests/helpers/expenseRecord.helper.js` hands out a fresh day outside the seeded range, and in the
past, since a future date is refused. The literal dates the month-filter tests assert on (2021-03
through 2023-06) sit between the helper's range and the seeded one, so neither adds a row the other
counts.

A record is also never dated ahead: `assertNotFuture` refuses one past tomorrow on create and update.
Tomorrow, not today, because the client sends the date from the user's own clock and the server does not
know its zone — a user six hours ahead is a day ahead for the first six hours of every day. The web caps
its date field and its schema at the user's own today, which is the clock that can tell.

**Expense types** — `active` / `inactive` (and `all`, a filter value only) live in
`src/constants/status.js` with every other status vocabulary, and `expenseTypeStatusOf(is_active)` there
is the one bridge from the boolean column to those words; the `?status=` filter, the error listing the
allowed values and `EXPENSE_TYPE_MESSAGES.STATUS_CHANGED` all read from it. An expense type's `total` is
frozen after creation, because `expense_records` snapshot it at creation time; `PUT /expense-types/:id`
recomputes the total from the submitted categories and rejects the update with a 400 unless it still
equals the stored total (compared as integer cents). `PATCH /expense-types/:id/status` flips `is_active`, and `expenseRecords.service.js`
refuses to create or re-point a record onto an inactive type. `GET /expense-types` returns everything
unless `?status=active|inactive` narrows it.

Every expense type read carries a derived **`is_used`** boolean (an `EXISTS` against `expense_records`,
added by `expenseTypes.repository.js` to both `findAllByUserId` and `findById`) so the client can hide
a delete control it knows would be refused. It is not a column — do not try to write it.

`DELETE /expense-types/:id` succeeds **only while no expense record references the type** — once one
does it answers 409 and deactivating is the only route. The 409 stays reachable even with `is_used`
shipped, because the flag goes stale the moment another tab adds a record. `expense_records.expense_type_id` is
`ON DELETE CASCADE`, so a check-then-delete would destroy records for real if one were created in
between: `repository.removeIfUnused` puts the delete and the `NOT EXISTS` guard in one statement
instead. It returning no row is ambiguous by design — the service calls `findById` first so it can
answer 404 for "not yours / not there" and 409 for "still in use".

**Saving plans** — status is `active → completed → withdrawn` (migration 013 retired `cancelled`).
Those three values are spelled once, in `src/constants/status.js`; the Zod enum, the service rules and
the per-status response messages (`SAVING_PLAN_MESSAGES.STATUS_CHANGED`, one line per status, keyed by
the stored value) all read from it, so adding a status is a check-constraint change, a line in each
map and the repository SQL listed above rather than a string hunt. The status controller indexes
`STATUS_CHANGED` with no fallback, on purpose: `messages.js` checks at import that every saving-plan
and expense-type status has its line and throws otherwise, so a missing one stops the app from
starting rather than answering with no message.
`assertStatusTransition` in `savingPlans.service.js` owns the rules: completed may reopen to active
only while `currently_deposited < deposit_amount`, only completed can become withdrawn, and withdrawn is
final. Deposits are capped at `deposit_amount`: the service answers 400 with the remaining figure, and
`repository.addDeposit` repeats the status and cap guards inside its `UPDATE`, completing the plan in
the same statement when a deposit fills it — so racing deposits cannot overfill. The web mirrors the
transitions in `src/lib/savingPlan.js` `canChangeStatus`. On the dashboard, the Saving Summary
totals (deposit, withdrawal, profit) count active and completed plans and leave out withdrawn;
everything else — the weekly/monthly saving that feeds `calculateBudget` (Spending, Progress, Saving
Breakdown, stored daily budgets) and the Overview and Savings plan lists — counts active plans only.

Each plan carries its own `tax_rate`, a percent (migration 015, default 15, bounded 0–100 in
`limits.js` and the check constraint). `utils/savingPlan.js` `calculateProfit` is the one place profit,
tax, in-hand and net profit are worked out: profit is `withdrawal_amount - deposit_amount`, tax is
charged only on a gain, per plan, so one plan's loss never offsets another's tax, and in hand is the
withdrawal less that tax. The dashboard returns `taxRate`, `tax`, `inHand` and `netProfit` on every
plan; `GET /saving-plans` returns raw rows and the web's `normalizeSavingPlan` mirrors the maths. `taxRate` is optional on create (takes `DEFAULT_TAX_RATE`) and
on update (keeps the stored rate), and editable in any status like every other plan field.

**Uploads** — `upload.middleware.js` accepts `IMAGE_TYPES` (JPG/PNG/WEBP/GIF, in `limits.js`, mirrored
by the web's pickers) into memory. Its `single(field, maxMb)` wraps multer's so an oversized file
answers 400 `UPLOAD_MESSAGES.TOO_LARGE` rather than the generic 500 a raw `MulterError` would reach the
client as. There is no default size: each route passes its own — `TARGET_IMAGE_MAX_MB` (2MB) and
`AVATAR_MAX_MB` (3MB) — so a new upload route has to decide what it accepts. Then
`utils/image.js` `compressImage()` shrinks a file before it reaches Supabase: capped at 1024px on the
long edge and re-encoded as WebP q70, which puts a phone photo under 100KB. It returns the extension
and content type to store under, so callers must use those rather than the original filename's — the
output is WebP whatever went in. A re-encode that comes out no smaller than the source is discarded and
the original stored instead, so compressing can never cost space. Currently wired into
`targets.service.js` only; `user.service.js` avatars still upload at full size.

An avatar album is capped at `AVATAR_MAX` (3). Storage is the only record of it — every upload lands in
`${userId}/<uuid>.<ext>` and nothing replaces a file — so `uploadAvatar` counts the folder listing and
answers 400 `AVATAR_LIMIT_REACHED` before it uploads. A full album has to have a photo deleted first,
and the current avatar cannot be deleted (`AVATAR_IN_USE`), so the user picks another photo, then
deletes. The web mirrors the cap in its own `limits.js` and disables the picker rather than letting a
fourth file be chosen.

**Dates** — `pg` returns `date` columns as JS `Date`, while validated request bodies carry
`"YYYY-MM-DD"` strings. Always normalize with `toDateString()` from `src/utils/date.js` before comparing
or keying by a date; mismatches here are silent.

**Auth** — JWTs carry a `jti`. Logout inserts it into `token_denylist`, and `auth.middleware.js` checks
the denylist on every request, so token revocation is a DB round-trip, not stateless.

## Database

Plain SQL files in `migrations/`, applied in filename order by `scripts/migrate.js`, tracked in a
`migrations` table. New migration = next numbered `NNN_description.sql`. There is no down-migration path.

`scripts/reset.js` must drop every table any migration creates. Migrations use bare `create table` with
no `IF NOT EXISTS`, so a table left out of the reset list fails the next `npm run prepare:test` with
`42P07 relation already exists` — which is what `token_denylist` and `daily_extra_savings` did until they
were added to it. A new migration that creates a table needs a matching entry there.

## Local setup

Postgres must already have the role and database `.env.test` names — nothing in the repo creates them:

```bash
sudo -u postgres psql -c "CREATE ROLE test_user WITH LOGIN PASSWORD 'test123';"
sudo -u postgres createdb -O test_user financial_planner_test
```

No extension is needed; `gen_random_uuid()` is built into Postgres 13+. Then `npm run test:all`.

Seeded test data (`scripts/seed.js`) is what the test suite assumes: `test@example.com` and
`other@example.com`, both `password123`, with the second user existing specifically to test cross-user
authorization. Tests log in through `tests/helpers/auth.helper.js` and hit the real app via supertest
against the real test database — they are integration tests, nothing is mocked.
