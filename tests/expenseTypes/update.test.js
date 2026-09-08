import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import { login, loginSecondUser } from "../helpers/auth.helper.js";
import { createExpenseType } from "../helpers/expenseType.helper.js";

// The helper's default categories total 150.00 — every accepted update
// below has to add up to exactly that.
describe("PUT /api/expense-types/:id", () => {
  it("should update expense type when the total matches", async () => {
    const { token, expenseType } = await createExpenseType();

    const response = await api()
      .put(`/api/expense-types/${expenseType.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Updated Expense",
        categories: [
          { name: "Bus", amount: 60 },
          { name: "Food", amount: 90 },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe("Updated Expense");
    expect(response.body.data.total).toBe("150.00");
    expect(response.body.data.categories).toEqual([
      { name: "Bus", amount: 60 },
      { name: "Food", amount: 90 },
    ]);
  });

  it("should allow a different number of categories at the same total", async () => {
    const { token, expenseType } = await createExpenseType();

    const response = await api()
      .put(`/api/expense-types/${expenseType.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Split Expense",
        categories: [
          { name: "Bus", amount: 50 },
          { name: "Food", amount: 50 },
          { name: "Tea", amount: 50 },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.data.total).toBe("150.00");
  });

  it("should reject an update that raises the total", async () => {
    const { token, expenseType } = await createExpenseType();

    const response = await api()
      .put(`/api/expense-types/${expenseType.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Bigger Expense",
        categories: [
          { name: "Bus", amount: 60 },
          { name: "Food", amount: 140 },
        ],
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Total amount must remain 150.00");
  });

  it("should reject an update that lowers the total", async () => {
    const { token, expenseType } = await createExpenseType();

    const response = await api()
      .put(`/api/expense-types/${expenseType.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Smaller Expense",
        categories: [{ name: "Bus", amount: 149.99 }],
      });

    expect(response.status).toBe(400);
  });

  it("should not change the total when the update is rejected", async () => {
    const { token, expenseType } = await createExpenseType();

    await api()
      .put(`/api/expense-types/${expenseType.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Bigger Expense",
        categories: [{ name: "Bus", amount: 500 }],
      });

    const check = await api()
      .get(`/api/expense-types/${expenseType.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(check.body.data.total).toBe("150.00");
    expect(check.body.data.name).toBe("Daily Expense");
  });

  it("should accept a matching total made of fractional amounts", async () => {
    const { token, expenseType } = await createExpenseType();

    const response = await api()
      .put(`/api/expense-types/${expenseType.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Fractional Expense",
        categories: [
          { name: "Bus", amount: 50.1 },
          { name: "Food", amount: 49.9 },
          { name: "Tea", amount: 50 },
        ],
      });

    expect(response.status).toBe(200);
    expect(response.body.data.total).toBe("150.00");
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
        categories: [{ name: "Bus", amount: 150 }],
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
        categories: [{ name: "Hack", amount: 150 }],
      });

    expect(response.status).toBe(404);
  });

  it("should still update a deactivated expense type", async () => {
    const { token, expenseType } = await createExpenseType();

    await api()
      .patch(`/api/expense-types/${expenseType.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ is_active: false });

    const response = await api()
      .put(`/api/expense-types/${expenseType.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Renamed While Inactive",
        categories: [{ name: "Bus", amount: 150 }],
      });

    expect(response.status).toBe(200);
    expect(response.body.data.is_active).toBe(false);
  });
});
