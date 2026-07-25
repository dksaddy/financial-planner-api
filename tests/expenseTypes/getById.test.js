import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import { login, loginSecondUser } from "../helpers/auth.helper.js";
import { createExpenseType } from "../helpers/expenseType.helper.js";

describe("GET /api/expense-types/:id", () => {
  it("should return an expense type", async () => {
    const { token, expenseType } = await createExpenseType();

    const response = await api()
      .get(`/api/expense-types/${expenseType.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.id).toBe(expenseType.id);
  });

  it("should return 404 for non-existing expense type", async () => {
    const { token } = await login();

    const response = await api()
      .get("/api/expense-types/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it("should reject unauthenticated request", async () => {
    const { expenseType } = await createExpenseType();

    const response = await api().get(
      `/api/expense-types/${expenseType.id}`
    );

    expect(response.status).toBe(401);
  });

  it("should not allow another user to access expense type", async () => {
    const { expenseType } = await createExpenseType();

    const { token } = await loginSecondUser();

    const response = await api()
      .get(`/api/expense-types/${expenseType.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
  });
});