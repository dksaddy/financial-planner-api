import { randomInt } from "node:crypto";

import { api } from "./request.helper.js";
import { login } from "./auth.helper.js";
import { createExpenseType } from "./expenseType.helper.js";

// expense_records carries unique (user_id, date), and the seed already fills
// 2026-07-01..2026-07-15 for the test user — so a fixed date here would clash
// with the seed on the first call and with itself on the second. Every call
// takes a fresh day well outside the seeded range instead. The random base
// keeps successive runs, which share one database unless `prepare:test` wipes
// it between them, from landing on the same day as each other.
//
// The days are in the past because a record cannot be dated ahead of today,
// and far enough back to stay clear of both the seeded range and the literal
// months the month-filtering tests assert exact counts on (2021 through 2023).
// A random day landing in one of those months adds a row those tests did not
// seed, and they fail a run later once it is in the database. 1000 days from
// 2015 reaches 2017, and the offsets below add days, not years.
const dateBase = randomInt(0, 1000);
let dateOffset = 0;

export function nextExpenseDate() {
  const day = new Date(Date.UTC(2015, 0, 1));

  day.setUTCDate(day.getUTCDate() + dateBase + dateOffset++);

  return day.toISOString().slice(0, 10);
}

export async function createExpenseRecord(token = null, overrides = {}) {
  if (!token) {
    const loginResult = await login();
    token = loginResult.token;
  }

  const { expenseType } = await createExpenseType(token);

  const post = (date) =>
    api()
      .post("/api/expense-records")
      .set("Authorization", `Bearer ${token}`)
      .send({
        expense_type_id: expenseType.id,
        date,
        ...overrides,
      });

  let response = await post(nextExpenseDate());

  // The random base only makes a clash unlikely: records from earlier runs
  // stay in the database until `prepare:test` wipes it, so a day can already
  // be taken, and the helper handed back no record. Unless the caller pinned
  // the date, move on to the next free day.
  for (
    let attempt = 0;
    response.status === 409 && overrides.date === undefined && attempt < 20;
    attempt++
  ) {
    response = await post(nextExpenseDate());
  }

  return {
    token,
    expenseRecord: response.body.data,
    expenseType,
  };
}