import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import { login } from "../helpers/auth.helper.js";
import { createSavingPlan } from "../helpers/savingPlan.helper.js";

describe("PUT /api/saving-plans/:id", () => {
  it("should update a saving plan", async () => {
    const { token, plan } = await createSavingPlan();

    const response = await api()
      .put(`/api/saving-plans/${plan.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Updated Plan",
        amount: 10000,
        frequency: 30,
        months: 24,
        depositAmount: 1000,
        depositFrequency: 30,
        withdrawalAmount: 100,
      });

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data.name).toBe("Updated Plan");

    expect(response.body.data.amount).toBe("10000.00");
  });

  it("should reject unauthenticated request", async () => {
    const { plan } = await createSavingPlan();

    const response = await api()
      .put(`/api/saving-plans/${plan.id}`)
      .send({
        name: "Updated Plan",
        amount: 10000,
        frequency: 30,
        months: 24,
        depositAmount: 1000,
        depositFrequency: 30,
        withdrawalAmount: 100,
      });

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
  });

  it("should reject invalid request body", async () => {
    const { token, plan } = await createSavingPlan();

    const response = await api()
      .put(`/api/saving-plans/${plan.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "",
        amount: -100,
        frequency: 0,
        months: -1,
        depositAmount: -10,
        depositFrequency: 0,
        withdrawalAmount: -1,
      });

    expect(response.status).toBe(400);

    expect(response.body.success).toBe(false);
  });

  it("should return 404 if saving plan does not exist", async () => {
    const { token } = await login();

    const response = await api()
      .put("/api/saving-plans/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Updated Plan",
        amount: 10000,
        frequency: 30,
        months: 24,
        depositAmount: 1000,
        depositFrequency: 30,
        withdrawalAmount: 100,
      });

    expect(response.status).toBe(404);

    expect(response.body.success).toBe(false);
  });
});