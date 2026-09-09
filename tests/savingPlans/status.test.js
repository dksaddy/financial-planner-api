import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
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
      .send({ status: "completed" });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("completed");

    const check = await api()
      .get(`/api/saving-plans/${plan.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(check.status).toBe(200);
    expect(check.body.data.status).toBe("completed");
  });

  it("should reopen a cancelled plan", async () => {
    const { token, plan } = await createSavingPlan();

    await api()
      .patch(`/api/saving-plans/${plan.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "cancelled" });

    const response = await api()
      .patch(`/api/saving-plans/${plan.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "active" });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("active");
  });

  it("should reject a status outside the allowed set", async () => {
    const { token, plan } = await createSavingPlan();

    const response = await api()
      .patch(`/api/saving-plans/${plan.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "paused" });

    expect(response.status).toBe(400);
  });

  it("should refuse deposits once a plan is not active", async () => {
    const { token, plan } = await createSavingPlan();

    await api()
      .patch(`/api/saving-plans/${plan.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "cancelled" });

    const response = await api()
      .patch(`/api/saving-plans/${plan.id}/deposit`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 100 });

    expect(response.status).toBe(400);
  });

  it("should reject unauthenticated request", async () => {
    const { plan } = await createSavingPlan();

    const response = await api()
      .patch(`/api/saving-plans/${plan.id}/status`)
      .send({ status: "completed" });

    expect(response.status).toBe(401);
  });

  it("should return 404 if not found", async () => {
    const { token } = await login();

    const response = await api()
      .patch(
        "/api/saving-plans/00000000-0000-0000-0000-000000000000/status"
      )
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "completed" });

    expect(response.status).toBe(404);
  });

  it("should not allow another user to change status", async () => {
    const { plan } = await createSavingPlan();

    const { token } = await loginSecondUser();

    const response = await api()
      .patch(`/api/saving-plans/${plan.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "cancelled" });

    expect(response.status).toBe(404);
  });
});
