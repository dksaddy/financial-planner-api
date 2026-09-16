import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import { TEST_USER } from "../helpers/constants.js";
import { login } from "../helpers/auth.helper.js";
import { createSavingPlan } from "../helpers/savingPlan.helper.js";

describe("PATCH /api/saving-plans/:id/deposit", () => {
  it("should add a deposit and increase currently_deposited", async () => {
    const { token, plan } = await createSavingPlan();

    const response = await api()
      .patch(`/api/saving-plans/${plan.id}/deposit`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 250, password: TEST_USER.password });

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data.currently_deposited).toBe("250.00");
  });

  it("should accumulate multiple deposits", async () => {
    const { token, plan } = await createSavingPlan();

    await api()
      .patch(`/api/saving-plans/${plan.id}/deposit`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 100, password: TEST_USER.password });

    const response = await api()
      .patch(`/api/saving-plans/${plan.id}/deposit`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 150, password: TEST_USER.password });

    expect(response.status).toBe(200);

    expect(response.body.data.currently_deposited).toBe("250.00");
  });

  it("should reject a deposit above the remaining amount", async () => {
    const { token, plan } = await createSavingPlan();

    await api()
      .patch(`/api/saving-plans/${plan.id}/deposit`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 300, password: TEST_USER.password });

    const response = await api()
      .patch(`/api/saving-plans/${plan.id}/deposit`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 200.01, password: TEST_USER.password });

    expect(response.status).toBe(400);

    expect(response.body.message).toBe(
      "Deposit exceeds the remaining 200.00"
    );

    const check = await api()
      .get(`/api/saving-plans/${plan.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(check.body.data.currently_deposited).toBe("300.00");
  });

  it("should complete the plan when a deposit fills it", async () => {
    const { token, plan } = await createSavingPlan();

    await api()
      .patch(`/api/saving-plans/${plan.id}/deposit`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 300, password: TEST_USER.password });

    const response = await api()
      .patch(`/api/saving-plans/${plan.id}/deposit`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 200, password: TEST_USER.password });

    expect(response.status).toBe(200);

    expect(response.body.data.currently_deposited).toBe("500.00");

    expect(response.body.data.status).toBe("completed");
  });

  it("should refuse any deposit once the plan is full", async () => {
    const { token, plan } = await createSavingPlan();

    await api()
      .patch(`/api/saving-plans/${plan.id}/deposit`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 500, password: TEST_USER.password });

    const response = await api()
      .patch(`/api/saving-plans/${plan.id}/deposit`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 1, password: TEST_USER.password });

    expect(response.status).toBe(400);
  });

  it("should reject unauthenticated request", async () => {
    const { plan } = await createSavingPlan();

    const response = await api()
      .patch(`/api/saving-plans/${plan.id}/deposit`)
      .send({ amount: 100, password: TEST_USER.password });

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
  });

  it("should reject a non-positive amount", async () => {
    const { token, plan } = await createSavingPlan();

    const response = await api()
      .patch(`/api/saving-plans/${plan.id}/deposit`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 0, password: TEST_USER.password });

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
      .send({ amount: 100, password: TEST_USER.password });

    expect(response.status).toBe(404);

    expect(response.body.success).toBe(false);
  });
});