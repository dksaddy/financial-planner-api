import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import { login } from "../helpers/auth.helper.js";
import { createExpenseType } from "../helpers/expenseType.helper.js";

describe("GET /api/expense-types", () => {
  it("should return all expense types", async () => {
    await createExpenseType();

    const { token } = await login();

    const response = await api()
      .get("/api/expense-types")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it("should reject unauthenticated request", async () => {
    const response = await api().get("/api/expense-types");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("should return an array", async () => {
    const { token } = await login();

    const response = await api()
      .get("/api/expense-types")
      .set("Authorization", `Bearer ${token}`);

    expect(Array.isArray(response.body.data)).toBe(true);
  });
});