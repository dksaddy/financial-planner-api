import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import { login, loginSecondUser } from "../helpers/auth.helper.js";
import { createExpenseType } from "../helpers/expenseType.helper.js";

describe("PATCH /api/expense-types/:id/status", () => {
  it("should create expense types active by default", async () => {
    const { expenseType } = await createExpenseType();

    expect(expenseType.is_active).toBe(true);
  });

  it("should deactivate an expense type", async () => {
    const { token, expenseType } = await createExpenseType();

    const response = await api()
      .patch(`/api/expense-types/${expenseType.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ is_active: false });

    expect(response.status).toBe(200);
    expect(response.body.data.is_active).toBe(false);

    const check = await api()
      .get(`/api/expense-types/${expenseType.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(check.status).toBe(200);
    expect(check.body.data.is_active).toBe(false);
  });

  it("should reactivate a deactivated expense type", async () => {
    const { token, expenseType } = await createExpenseType();

    await api()
      .patch(`/api/expense-types/${expenseType.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ is_active: false });

    const response = await api()
      .patch(`/api/expense-types/${expenseType.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ is_active: true });

    expect(response.status).toBe(200);
    expect(response.body.data.is_active).toBe(true);
  });

  it("should reject a non-boolean status", async () => {
    const { token, expenseType } = await createExpenseType();

    const response = await api()
      .patch(`/api/expense-types/${expenseType.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ is_active: "yes" });

    expect(response.status).toBe(400);
  });

  it("should reject unauthenticated request", async () => {
    const { expenseType } = await createExpenseType();

    const response = await api()
      .patch(`/api/expense-types/${expenseType.id}/status`)
      .send({ is_active: false });

    expect(response.status).toBe(401);
  });

  it("should return 404 if not found", async () => {
    const { token } = await login();

    const response = await api()
      .patch(
        "/api/expense-types/00000000-0000-0000-0000-000000000000/status"
      )
      .set("Authorization", `Bearer ${token}`)
      .send({ is_active: false });

    expect(response.status).toBe(404);
  });

  it("should not allow another user to change status", async () => {
    const { expenseType } = await createExpenseType();

    const { token } = await loginSecondUser();

    const response = await api()
      .patch(`/api/expense-types/${expenseType.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ is_active: false });

    expect(response.status).toBe(404);
  });
});

describe("DELETE /api/expense-types/:id", () => {
  it("should no longer exist", async () => {
    const { token, expenseType } = await createExpenseType();

    const response = await api()
      .delete(`/api/expense-types/${expenseType.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
  });
});
