import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import { login, loginSecondUser } from "../helpers/auth.helper.js";
import { createExpenseType } from "../helpers/expenseType.helper.js";

describe("PUT /api/expense-types/:id", () => {
  it("should update expense type", async () => {
    const { token, expenseType } = await createExpenseType();

    const response = await api()
      .put(`/api/expense-types/${expenseType.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Updated Expense",
        categories: [
          { name: "Bus", amount: 60 },
          { name: "Food", amount: 140 },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe("Updated Expense");
    expect(response.body.data.total).toBe("200.00");
  });

  it("should reject invalid body", async () => {
    const { token, expenseType } = await createExpenseType();

    const response = await api()
      .put(`/api/expense-types/${expenseType.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "",
        categories: [],
      });

    expect(response.status).toBe(400);
  });

  it("should reject unauthenticated request", async () => {
    const { expenseType } = await createExpenseType();

    const response = await api()
      .put(`/api/expense-types/${expenseType.id}`)
      .send({
        name: "Updated",
        categories: [{ name: "Bus", amount: 50 }],
      });

    expect(response.status).toBe(401);
  });

  it("should return 404 if not found", async () => {
    const { token } = await login();

    const response = await api()
      .put("/api/expense-types/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Updated",
        categories: [{ name: "Bus", amount: 50 }],
      });

    expect(response.status).toBe(404);
  });

  it("should not allow another user to update", async () => {
    const { expenseType } = await createExpenseType();

    const { token } = await loginSecondUser();

    const response = await api()
      .put(`/api/expense-types/${expenseType.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Hack",
        categories: [{ name: "Hack", amount: 1 }],
      });

    expect(response.status).toBe(404);
  });
});