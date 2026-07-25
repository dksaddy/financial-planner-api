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