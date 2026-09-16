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
// The epoch is 2040 rather than 2030 to stay clear of the literal dates the
// month-filtering tests assert exact counts on (2030-03 through 2032-06). A
// random day landing in one of those months adds a row those tests did not
// seed, and they fail a run later once it is in the database.
const dateBase = randomInt(0, 20000);
let dateOffset = 0;

export function nextExpenseDate() {
  const day = new Date(Date.UTC(2040, 0, 1));

  day.setUTCDate(day.getUTCDate() + dateBase + dateOffset++);

  return day.toISOString().slice(0, 10);
}

export async function createExpenseRecord(token = null, overrides = {}) {
  if (!token) {
    const loginResult = await login();
    token = loginResult.token;
  }

  const { expenseType } = await createExpenseType(token);

  const payload = {
    expense_type_id: expenseType.id,
    date: nextExpenseDate(),
    ...overrides,
  };

  const response = await api()
    .post("/api/expense-records")
    .set("Authorization", `Bearer ${token}`)
    .send(payload);

  return {
    token,
    expenseRecord: response.body.data,
    expenseType,
  };
}