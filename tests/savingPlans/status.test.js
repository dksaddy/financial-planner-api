import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import { TEST_USER } from "../helpers/constants.js";
import { login, loginSecondUser } from "../helpers/auth.helper.js";
import { createSavingPlan } from "../helpers/savingPlan.helper.js";

describe("PATCH /api/saving-plans/:id/status", () => {
  it("should create saving plans active by default", async () => {
    const { plan } = await createSavingPlan();

    expect(plan.status).toBe("active");
  });

  it("should mark a plan completed", async () => {
    const { token, plan } = await createSavingPlan();

    const response = await api()
      .patch(`/api/saving-plans/${plan.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "completed", password: TEST_USER.password });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("completed");

    const check = await api()
      .get(`/api/saving-plans/${plan.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(check.status).toBe(200);
    expect(check.body.data.status).toBe("completed");
  });

  it("should reopen a completed plan that is not fully deposited", async () => {
    const { token, plan } = await createSavingPlan();

    await api()
      .patch(`/api/saving-plans/${plan.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "completed", password: TEST_USER.password });

    const response = await api()
      .patch(`/api/saving-plans/${plan.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "active", password: TEST_USER.password });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("active");
  });

  it("should refuse to reopen a fully deposited plan", async () => {
    const { token, plan } = await createSavingPlan();

    await api()
      .patch(`/api/saving-plans/${plan.id}/deposit`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 500, password: TEST_USER.password });

    const response = await api()
      .patch(`/api/saving-plans/${plan.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "active", password: TEST_USER.password });

    expect(response.status).toBe(400);
  });

  it("should withdraw a completed plan", async () => {
    const { token, plan } = await createSavingPlan();

    await api()
      .patch(`/api/saving-plans/${plan.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "completed", password: TEST_USER.password });

    const response = await api()
      .patch(`/api/saving-plans/${plan.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "withdrawn", password: TEST_USER.password });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("withdrawn");
  });

  it("should refuse to withdraw an active plan", async () => {
    const { token, plan } = await createSavingPlan();

    const response = await api()
      .patch(`/api/saving-plans/${plan.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "withdrawn", password: TEST_USER.password });

    expect(response.status).toBe(400);

    const check = await api()
      .get(`/api/saving-plans/${plan.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(check.body.data.status).toBe("active");
  });

  it("should keep a withdrawn plan withdrawn", async () => {
    const { token, plan } = await createSavingPlan();

    for (const status of ["completed", "withdrawn"]) {
      await api()
        .patch(`/api/saving-plans/${plan.id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status, password: TEST_USER.password });
    }

    for (const status of ["active", "completed"]) {
      const response = await api()
        .patch(`/api/saving-plans/${plan.id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status, password: TEST_USER.password });

      expect(response.status).toBe(400);
    }
  });

  it("should reject a status outside the allowed set", async () => {
    const { token, plan } = await createSavingPlan();

    for (const status of ["paused", "cancelled"]) {
      const response = await api()
        .patch(`/api/saving-plans/${plan.id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status, password: TEST_USER.password });

      expect(response.status).toBe(400);
    }
  });

  it("should refuse deposits once a plan is not active", async () => {
    const { token, plan } = await createSavingPlan();

    await api()
      .patch(`/api/saving-plans/${plan.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "completed", password: TEST_USER.password });

    const response = await api()
      .patch(`/api/saving-plans/${plan.id}/deposit`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 100, password: TEST_USER.password });

    expect(response.status).toBe(400);
  });

  it("should reject unauthenticated request", async () => {
    const { plan } = await createSavingPlan();

    const response = await api()
      .patch(`/api/saving-plans/${plan.id}/status`)
      .send({ status: "completed", password: TEST_USER.password });

    expect(response.status).toBe(401);
  });

  it("should return 404 if not found", async () => {
    const { token } = await login();

    const response = await api()
      .patch(
        "/api/saving-plans/00000000-0000-0000-0000-000000000000/status"
      )
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "completed", password: TEST_USER.password });

    expect(response.status).toBe(404);
  });

  it("should not allow another user to change status", async () => {
    const { plan } = await createSavingPlan();

    const { token } = await loginSecondUser();

    const response = await api()
      .patch(`/api/saving-plans/${plan.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "completed", password: TEST_USER.password });

    expect(response.status).toBe(404);
  });
});
