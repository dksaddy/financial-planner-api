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
(`{ pagination, summary, months }`); `meta` is omitted from the JSON entirely when not passed, so other
endpoints keep their exact shape. Paged list queries must carry a tiebreaker in the `ORDER BY`
(`date DESC, created_at DESC, id DESC`) or rows shift between pages, and the service clamps a page past
the end to the last page rather than returning an empty list.

Errors: `AppError` sets `isOperational`. `error.middleware.js` only echoes messages from operational
errors; anything else becomes a generic 500 with the real error logged server-side. Validation failures
short-circuit in `validate.middleware.js` with a different shape (`{ success, message, errors[] }` — no
`statusCode`), so tests asserting on validation responses should not expect the `ApiResponse` shape.

## Cross-cutting domain logic

**Budget** — `src/utils/budget.js` is the single source of truth for salary → spendable budget
(`weeklySaving * 4 + monthlySaving`, divided over 26 working days/month, 6/week — Friday excluded).
Both the dashboard and the Extra Saving feature call it; never recompute a budget inline.

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
`tests/helpers/expenseRecord.helper.js` hands out a fresh day outside the seeded range.

**Expense types** — an expense type's `total` is frozen after creation, because `expense_records`
snapshot it at creation time; `PUT /expense-types/:id` recomputes the total from the submitted
categories and rejects the update with a 400 unless it still equals the stored total (compared as
integer cents). `PATCH /expense-types/:id/status` flips `is_active`, and `expenseRecords.service.js`
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

**Dates** — `pg` returns `date` columns as JS `Date`, while validated request bodies carry
`"YYYY-MM-DD"` strings. Always normalize with `toDateString()` from `src/utils/date.js` before comparing
or keying by a date; mismatches here are silent.

**Auth** — JWTs carry a `jti`. Logout inserts it into `token_denylist`, and `auth.middleware.js` checks
the denylist on every request, so token revocation is a DB round-trip, not stateless.

## Database

Plain SQL files in `migrations/`, applied in filename order by `scripts/migrate.js`, tracked in a
`migrations` table. New migration = next numbered `NNN_description.sql`. There is no down-migration path.

Known gotcha: `scripts/reset.js` does not drop `token_denylist` or `daily_extra_savings`, and those
migrations use bare `create table` (no `IF NOT EXISTS`), so a second `npm run prepare:test` fails once
those tables already exist. Drop them manually or add them to the reset list.

Seeded test data (`scripts/seed.js`) is what the test suite assumes: `test@example.com` and
`other@example.com`, both `password123`, with the second user existing specifically to test cross-user
authorization. Tests log in through `tests/helpers/auth.helper.js` and hit the real app via supertest
against the real test database — they are integration tests, nothing is mocked.
