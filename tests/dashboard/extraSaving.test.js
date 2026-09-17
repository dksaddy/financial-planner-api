import { describe, it, expect } from "vitest";

import { api } from "../helpers/request.helper.js";
import { registerFreshUser } from "../helpers/auth.helper.js";
import { createExpenseType } from "../helpers/expenseType.helper.js";
import { nextExpenseDate } from "../helpers/expenseRecord.helper.js";

// Fresh users throughout: Extra Save is a whole-account figure.

const auth = (request, token) =>
  request.set("Authorization", `Bearer ${token}`);

const setProfile = (token, body) =>
  auth(api().put("/api/users/profile"), token).send(body);

const dashboard = async (token) =>
  (await auth(api().get("/api/dashboard"), token)).body.data;

const postRecord = (token, expenseTypeId, date) =>
  auth(api().post("/api/expense-records"), token).send({
    expense_type_id: expenseTypeId,
    date,
  });

// A budget of exactly 1000 a day.
const budgetedUser = async () => {
  const { token } = await registerFreshUser();

  await setProfile(token, { salary: 26000, working_days_per_month: 26 });

  return token;
};

describe("Dashboard Extra Save", () => {
  it("should bank each recorded day's budget less its spend", async () => {
    const token = await budgetedUser();
    const { expenseType } = await createExpenseType(token); // 150

    await postRecord(token, expenseType.id, nextExpenseDate());
    await postRecord(token, expenseType.id, nextExpenseDate());

    expect((await dashboard(token)).extraSaving).toEqual({
      totalExtraSave: 1700,
      totalDeductedByTargets: 0,
    });
  });

  it("should drop a day's saving when its last record is deleted", async () => {
    const token = await budgetedUser();
    const { expenseType } = await createExpenseType(token);

    const created = await postRecord(token, expenseType.id, nextExpenseDate());

    await auth(
      api().delete(`/api/expense-records/${created.body.data.id}`),
      token
    );

    expect((await dashboard(token)).extraSaving.totalExtraSave).toBe(0);
  });

  it("should keep a day on the budget it was first written with", async () => {
    const token = await budgetedUser();
    const { expenseType } = await createExpenseType(token);
    const { expenseType: other } = await createExpenseType(token, {
      categories: [{ name: "Food", amount: 200 }],
    });

    const date = nextExpenseDate();
    const created = await postRecord(token, expenseType.id, date);

    // The budget doubles after the day was written.
    await setProfile(token, { salary: 52000 });

    // Editing the old record re-weighs its spend, not its budget.
    const edited = await auth(
      api().put(`/api/expense-records/${created.body.data.id}`),
      token
    ).send({ expense_type_id: other.id, date });

    expect(edited.status).toBe(200);

    const list = await auth(api().get("/api/expense-records"), token);

    expect(list.body.meta.extraSavings[date]).toEqual({
      budget_amount: "1000.00",
      spent_amount: "200.00",
      extra_amount: "800.00",
    });

    // A day written after the change takes the new budget.
    const later = nextExpenseDate();

    await postRecord(token, expenseType.id, later);

    const again = await auth(api().get("/api/expense-records"), token);

    expect(again.body.meta.extraSavings[later].budget_amount).toBe("2000.00");
  });
});
