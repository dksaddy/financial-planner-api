import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import { login } from "../helpers/auth.helper.js";

describe("POST /api/expense-types", () => {
  it("should create an expense type", async () => {
    const { token } = await login();

    const response = await api()
      .post("/api/expense-types")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Daily Expense",
        categories: [
          { name: "Transport", amount: 50 },
          { name: "Food", amount: 100 },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);

    expect(response.body.data).toHaveProperty("id");
    expect(response.body.data.name).toBe("Daily Expense");
    expect(response.body.data.total).toBe("150.00");
  });

  it("should reject unauthenticated request", async () => {
    const response = await api()
      .post("/api/expense-types")
      .send({
        name: "Daily Expense",
        categories: [
          { name: "Transport", amount: 50 },
        ],
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("should reject invalid request body", async () => {
    const { token } = await login();

    const response = await api()
      .post("/api/expense-types")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "",
        categories: [],
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});