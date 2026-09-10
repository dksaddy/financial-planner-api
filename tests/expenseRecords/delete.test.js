import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import {
  login,
  loginSecondUser,
} from "../helpers/auth.helper.js";
import { createExpenseRecord } from "../helpers/expenseRecord.helper.js";

describe("DELETE /api/expense-records/:id", () => {
  it("should delete an expense record", async () => {
    const { token, expenseRecord } = await createExpenseRecord();

    const response = await api()
      .delete(`/api/expense-records/${expenseRecord.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    const check = await api()
      .get(`/api/expense-records/${expenseRecord.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(check.status).toBe(404);
  });

  it("should leave the total extra save unchanged after a create and delete", async () => {
    const { token } = await login();

    const before = await api()
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${token}`);

    const { expenseRecord } = await createExpenseRecord(token);

    await api()
      .delete(`/api/expense-records/${expenseRecord.id}`)
      .set("Authorization", `Bearer ${token}`);

    const after = await api()
      .get("/api/dashboard")
      .set("Authorization", `Bearer ${token}`);

    // Deleting the only record of a day used to leave its daily_extra_savings
    // row behind with spent_amount 0, banking a whole day's budget as extra
    // saving for a day with nothing recorded on it.
    expect(after.body.data.extraSaving.totalExtraSave).toBe(
      before.body.data.extraSaving.totalExtraSave
    );
  });

  it("should reject unauthenticated request", async () => {
    const { expenseRecord } = await createExpenseRecord();

    const response = await api().delete(
      `/api/expense-records/${expenseRecord.id}`
    );

    expect(response.status).toBe(401);
  });

  it("should return 404 if record not found", async () => {
    const { token } = await login();

    const response = await api()
      .delete("/api/expense-records/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it("should not allow another user to delete", async () => {
    const { expenseRecord } = await createExpenseRecord();

    const { token } = await loginSecondUser();

    const response = await api()
      .delete(`/api/expense-records/${expenseRecord.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
  });
});