import { randomInt } from "node:crypto";

import { api } from "./request.helper.js";
import { login } from "./auth.helper.js";
import { createExpenseType } from "./expenseType.helper.js";

// expense_records carries unique (user_id, date), and the seed already fills
// 2026-07-01..2026-07-15 for the test user — so a fixed date here would clash
// with the seed on the first call and with itself on the second. Every call
// takes a fresh day well outside the seeded range instead. The random base
// keeps test files, which vitest runs in parallel against one database, from
// landing on the same day as each other.
const dateBase = randomInt(0, 20000);
let dateOffset = 0;

export function nextExpenseDate() {
  const day = new Date(Date.UTC(2030, 0, 1));

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