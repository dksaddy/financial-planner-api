import { describe, it, expect } from "vitest";

import { api } from "../helpers/request.helper.js";
import { registerFreshUser } from "../helpers/auth.helper.js";
import { createExpenseType } from "../helpers/expenseType.helper.js";
import { todayIn, weekRange } from "../../src/utils/date.js";

const auth = (request, token) =>
  request.set("Authorization", `Bearer ${token}`);

const shift = (date, days) => {
  const day = new Date(`${date}T00:00:00Z`);

  day.setUTCDate(day.getUTCDate() + days);

  return day.toISOString().slice(0, 10);
};

// Kiritimati is UTC+14, the furthest ahead of any server clock, so "today"
// there is tomorrow in UTC for most of every UTC day — the case the server's
// own date got wrong.
const ZONE = "Pacific/Kiritimati";

const zonedUser = async () => {
  const { token } = await registerFreshUser();

  await auth(api().put("/api/users/profile"), token).send({ time_zone: ZONE });

  const { expenseType } = await createExpenseType(token);

  const post = (date) =>
    auth(api().post("/api/expense-records"), token).send({
      expense_type_id: expenseType.id,
      date,
    });

  return { token, post };
};

describe("The user's own today", () => {
  it("should accept a record dated today in the user's zone", async () => {
    const { post } = await zonedUser();

    expect((await post(todayIn(ZONE))).status).toBe(201);
  });

  it("should refuse a record dated tomorrow in the user's zone", async () => {
    const { post } = await zonedUser();

    const response = await post(shift(todayIn(ZONE), 1));

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "An expense record cannot be dated in the future"
    );
  });

  it("should place records in the weeks of the user's own calendar", async () => {
    const { token, post } = await zonedUser();

    // Saturdays: always inside the dashboard's week windows, whichever day of
    // the week today is.
    const [thisSaturday] = weekRange(todayIn(ZONE));
    const lastSaturday = shift(thisSaturday, -7);
    const fourWeeksAgo = shift(thisSaturday, -28);

    expect((await post(thisSaturday)).status).toBe(201);
    expect((await post(lastSaturday)).status).toBe(201);
    expect((await post(fourWeeksAgo)).status).toBe(201);

    const response = await auth(api().get("/api/dashboard"), token);
    const { currentWeek, lastFourWeeks } = response.body.data.expenses;

    expect(currentWeek.records.map((record) => record.date)).toEqual([
      thisSaturday,
    ]);
    expect(currentWeek.totalExpense).toBe(150);

    expect(lastFourWeeks.week1.map((record) => record.date)).toEqual([
      lastSaturday,
    ]);
    expect(lastFourWeeks.week2).toEqual([]);
    expect(lastFourWeeks.week3).toEqual([]);
    expect(lastFourWeeks.week4.map((record) => record.date)).toEqual([
      fourWeeksAgo,
    ]);
  });
});
