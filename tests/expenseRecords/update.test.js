import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import {
  login,
  loginSecondUser,
} from "../helpers/auth.helper.js";
import { createExpenseRecord } from "../helpers/expenseRecord.helper.js";
import { createExpenseType } from "../helpers/expenseType.helper.js";

describe("PUT /api/expense-records/:id", () => {
  it("should update an expense record", async () => {
    const { token, expenseRecord } = await createExpenseRecord();

    const { expenseType } = await createExpenseType(token, {
      name: "Updated Type",
    });

    const response = await api()
      .put(`/api/expense-records/${expenseRecord.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        expense_type_id: expenseType.id,
        date: "2026-08-01",
      });

    expect(response.status).toBe(200);
    expect(response.body.data.expense_type_id).toBe(expenseType.id);
  });

  it("should reject invalid request body", async () => {
    const { token, expenseRecord } = await createExpenseRecord();

    const response = await api()
      .put(`/api/expense-records/${expenseRecord.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        expense_type_id: "invalid",
        date: "",
      });

    expect(response.status).toBe(400);
  });

  it("should reject unauthenticated request", async () => {
    const { expenseRecord } = await createExpenseRecord();

    const response = await api()
      .put(`/api/expense-records/${expenseRecord.id}`)
      .send({});

    expect(response.status).toBe(401);
  });

  it("should return 404 if record not found", async () => {
    const { token } = await login();

    const { expenseType } = await createExpenseType(token);

    const response = await api()
      .put("/api/expense-records/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`)
      .send({
        expense_type_id: expenseType.id,
        date: "2026-08-01",
      });

    expect(response.status).toBe(404);
  });

  it("should not allow another user to update", async () => {
    const { expenseRecord } = await createExpenseRecord();

    const { token } = await loginSecondUser();

    const { expenseType } = await createExpenseType(token);

    const response = await api()
      .put(`/api/expense-records/${expenseRecord.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        expense_type_id: expenseType.id,
        date: "2026-08-01",
      });

    expect(response.status).toBe(404);
  });
});