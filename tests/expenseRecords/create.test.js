import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import { login } from "../helpers/auth.helper.js";
import { createExpenseType } from "../helpers/expenseType.helper.js";

describe("POST /api/expense-records", () => {
  it("should create an expense record", async () => {
    const { token } = await login();
    const { expenseType } = await createExpenseType(token);

    const response = await api()
      .post("/api/expense-records")
      .set("Authorization", `Bearer ${token}`)
      .send({
        expense_type_id: expenseType.id,
        date: "2026-07-15",
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);

    expect(response.body.data).toHaveProperty("id");
    expect(response.body.data.expense_type_id).toBe(expenseType.id);
  });

  it("should reject unauthenticated request", async () => {
    const response = await api()
      .post("/api/expense-records")
      .send({
        expense_type_id: "00000000-0000-0000-0000-000000000000",
        date: "2026-07-15",
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("should reject invalid request body", async () => {
    const { token } = await login();

    const response = await api()
      .post("/api/expense-records")
      .set("Authorization", `Bearer ${token}`)
      .send({
        expense_type_id: "invalid",
        date: "",
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("should return 404 if expense type does not exist", async () => {
    const { token } = await login();

    const response = await api()
      .post("/api/expense-records")
      .set("Authorization", `Bearer ${token}`)
      .send({
        expense_type_id: "00000000-0000-0000-0000-000000000000",
        date: "2026-07-15",
      });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});