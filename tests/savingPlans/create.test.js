import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import { login } from "../helpers/auth.helper.js";

describe("POST /api/saving-plans", () => {
  it("should create a saving plan", async () => {
    const { token } = await login();

    const response = await api()
      .post("/api/saving-plans")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Emergency Fund",
        amount: 50000,
        frequency: 30,
        months: 12,
        depositAmount: 4000,
        depositFrequency: 30,
        withdrawalAmount: 0,
      });

    expect(response.status).toBe(201);

    expect(response.body.success).toBe(true);

    expect(response.body.data).toHaveProperty("id");

    expect(response.body.data.name).toBe("Emergency Fund");
  });

  it("should reject unauthenticated request", async () => {
    const response = await api()
      .post("/api/saving-plans")
      .send({
        name: "Emergency Fund",
        amount: 50000,
        frequency: 30,
        months: 12,
        depositAmount: 4000,
        depositFrequency: 30,
        withdrawalAmount: 0,
      });

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
  });

  it("should reject invalid request body", async () => {
    const { token } = await login();

    const response = await api()
      .post("/api/saving-plans")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "",
        amount: -100,
        frequency: 0,
        months: 0,
        depositAmount: -1,
        depositFrequency: 0,
        withdrawalAmount: -1,
      });

    expect(response.status).toBe(400);

    expect(response.body.success).toBe(false);
  });
});
