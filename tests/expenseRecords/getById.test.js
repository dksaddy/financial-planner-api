import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import {
  login,
  loginSecondUser,
} from "../helpers/auth.helper.js";
import { createExpenseRecord } from "../helpers/expenseRecord.helper.js";

describe("GET /api/expense-records/:id", () => {
  it("should return an expense record", async () => {
    const { token, expenseRecord } = await createExpenseRecord();

    const response = await api()
      .get(`/api/expense-records/${expenseRecord.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(expenseRecord.id);
  });

  it("should reject unauthenticated request", async () => {
    const { expenseRecord } = await createExpenseRecord();

    const response = await api().get(
      `/api/expense-records/${expenseRecord.id}`
    );

    expect(response.status).toBe(401);
  });

  it("should return 404 if not found", async () => {
    const { token } = await login();

    const response = await api()
      .get("/api/expense-records/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it("should not allow another user to access", async () => {
    const { expenseRecord } = await createExpenseRecord();

    const { token } = await loginSecondUser();

    const response = await api()
      .get(`/api/expense-records/${expenseRecord.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
  });
});