import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import { login } from "../helpers/auth.helper.js";
import { createSavingPlan } from "../helpers/savingPlan.helper.js";

describe("PATCH /api/saving-plans/:id/deposit", () => {
  it("should add a deposit and increase currently_deposited", async () => {
    const { token, plan } = await createSavingPlan();

    const response = await api()
      .patch(`/api/saving-plans/${plan.id}/deposit`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 250 });

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data.currently_deposited).toBe("250.00");
  });

  it("should accumulate multiple deposits", async () => {
    const { token, plan } = await createSavingPlan();

    await api()
      .patch(`/api/saving-plans/${plan.id}/deposit`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 100 });

    const response = await api()
      .patch(`/api/saving-plans/${plan.id}/deposit`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 150 });

    expect(response.status).toBe(200);

    expect(response.body.data.currently_deposited).toBe("250.00");
  });

  it("should reject unauthenticated request", async () => {
    const { plan } = await createSavingPlan();

    const response = await api()
      .patch(`/api/saving-plans/${plan.id}/deposit`)
      .send({ amount: 100 });

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
  });

  it("should reject a non-positive amount", async () => {
    const { token, plan } = await createSavingPlan();

    const response = await api()
      .patch(`/api/saving-plans/${plan.id}/deposit`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 0 });

    expect(response.status).toBe(400);

    expect(response.body.success).toBe(false);
  });

  it("should reject a missing amount", async () => {
    const { token, plan } = await createSavingPlan();

    const response = await api()
      .patch(`/api/saving-plans/${plan.id}/deposit`)
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);

    expect(response.body.success).toBe(false);
  });

  it("should return 404 if saving plan does not exist", async () => {
    const { token } = await login();

    const response = await api()
      .patch(
        "/api/saving-plans/00000000-0000-0000-0000-000000000000/deposit"
      )
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 100 });

    expect(response.status).toBe(404);

    expect(response.body.success).toBe(false);
  });
});