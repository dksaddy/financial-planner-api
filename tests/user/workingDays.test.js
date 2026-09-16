import { randomUUID } from "node:crypto";

import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import { createExpenseRecord } from "../helpers/expenseRecord.helper.js";

// Every case registers its own user: working days feed the budget behind
// user-global figures, so changing the seeded user's would move numbers other
// test files assert on.
const registerFreshUser = async () => {
  const response = await api()
    .post("/api/auth/register")
    .send({
      name: "Working Days",
      email: `working-days-${randomUUID()}@example.com`,
      password: "password123",
    });

  return {
    token: response.body.data.token,
    user: response.body.data.user,
  };
};

const updateProfile = (token, body) =>
  api()
    .put("/api/users/profile")
    .set("Authorization", `Bearer ${token}`)
    .send(body);

describe("Working days", () => {
  it("should default a new user to 26 per month and 6 per week", async () => {
    const { user } = await registerFreshUser();

    expect(user.working_days_per_month).toBe(26);
    expect(user.working_days_per_week).toBe(6);
  });

  it("should divide the dashboard budget by the user's own working days", async () => {
    const { token } = await registerFreshUser();

    const update = await updateProfile(token, {
      salary: 22000,
      working_days_per_month: 22,
      working_days_per_week: 5,
    });

    expect(update.status).toBe(200);
    expect(update.body.data.working_days_per_month).toBe(22);
    expect(update.body.data.working_days_per_week).toBe(5);

    const dashboard = await api()
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${token}`);

    expect(dashboard.status).toBe(200);
    expect(dashboard.body.data.spending).toMatchObject({
      monthly: 22000,
      daily: 1000,
      weekly: 5000,
      workingDaysPerMonth: 22,
      workingDaysPerWeek: 5,
    });
  });

  it("should store a day's budget from the user's own working days", async () => {
    const { token } = await registerFreshUser();

    await updateProfile(token, {
      salary: 20000,
      working_days_per_month: 20,
    });

    const { expenseRecord } = await createExpenseRecord(token);

    const list = await api()
      .get("/api/expense-records")
      .set("Authorization", `Bearer ${token}`);

    expect(
      Number(list.body.meta.extraSavings[expenseRecord.date].budget_amount)
    ).toBe(1000);
  });

  it("should reject working days outside their range or not whole", async () => {
    const { token } = await registerFreshUser();

    for (const body of [
      { working_days_per_month: 0 },
      { working_days_per_month: 32 },
      { working_days_per_month: 22.5 },
      { working_days_per_week: 0 },
      { working_days_per_week: 8 },
    ]) {
      const response = await updateProfile(token, body);

      expect(response.status).toBe(400);
    }
  });

  it("should refuse more working days per week than per month", async () => {
    const { token } = await registerFreshUser();

    const both = await updateProfile(token, {
      working_days_per_month: 4,
      working_days_per_week: 5,
    });

    expect(both.status).toBe(400);
    expect(both.body.message).toBe(
      "Working days per week cannot exceed working days per month"
    );

    // Only the month sent: the stored week (6) is what it is weighed against.
    const monthOnly = await updateProfile(token, {
      working_days_per_month: 5,
    });

    expect(monthOnly.status).toBe(400);
  });
});
