import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import { TEST_USER } from "../helpers/constants.js";
import { login } from "../helpers/auth.helper.js";
import { createSavingPlan } from "../helpers/savingPlan.helper.js";

const WRONG_PASSWORD = "not-the-password";

const planPayload = (overrides = {}) => ({
  name: "Confirmed Plan",
  amount: 5000,
  frequency: 7,
  months: 12,
  depositAmount: 500,
  depositFrequency: 7,
  withdrawalAmount: 0,
  ...overrides,
});

// Every saving-plan mutation confirms the account password. These cover the
// two ways that can go wrong — absent and incorrect — and, for the mutations
// that change stored state, that nothing moved when it did.
describe("Saving plan password confirmation", () => {
  describe("rejects a wrong password", () => {
    it("on create", async () => {
      const { token } = await login();

      const response = await api()
        .post("/api/saving-plans")
        .set("Authorization", `Bearer ${token}`)
        .send(planPayload({ password: WRONG_PASSWORD }));

      expect(response.status).toBe(403);

      expect(response.body.success).toBe(false);
    });

    it("on update, leaving the plan untouched", async () => {
      const { token, plan } = await createSavingPlan();

      const response = await api()
        .put(`/api/saving-plans/${plan.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send(
          planPayload({
            name: "Renamed",
            password: WRONG_PASSWORD,
          })
        );

      expect(response.status).toBe(403);

      const check = await api()
        .get(`/api/saving-plans/${plan.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(check.body.data.name).toBe(plan.name);
    });

    it("on deposit, without moving the balance", async () => {
      const { token, plan } = await createSavingPlan();

      const response = await api()
        .patch(`/api/saving-plans/${plan.id}/deposit`)
        .set("Authorization", `Bearer ${token}`)
        .send({ amount: 100, password: WRONG_PASSWORD });

      expect(response.status).toBe(403);

      const check = await api()
        .get(`/api/saving-plans/${plan.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(check.body.data.currently_deposited).toBe(
        plan.currently_deposited
      );
    });

    it("on status change, leaving the status as it was", async () => {
      const { token, plan } = await createSavingPlan();

      const response = await api()
        .patch(`/api/saving-plans/${plan.id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({
          status: "completed",
          password: WRONG_PASSWORD,
        });

      expect(response.status).toBe(403);

      const check = await api()
        .get(`/api/saving-plans/${plan.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(check.body.data.status).toBe("active");
    });

    it("on delete, leaving the plan in place", async () => {
      const { token, plan } = await createSavingPlan();

      const response = await api()
        .delete(`/api/saving-plans/${plan.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({ password: WRONG_PASSWORD });

      expect(response.status).toBe(403);

      const check = await api()
        .get(`/api/saving-plans/${plan.id}`)
        .set("Authorization", `Bearer ${token}`);

      expect(check.status).toBe(200);
    });
  });

  describe("rejects a missing password", () => {
    it("on create", async () => {
      const { token } = await login();

      const response = await api()
        .post("/api/saving-plans")
        .set("Authorization", `Bearer ${token}`)
        .send(planPayload());

      expect(response.status).toBe(400);

      expect(response.body.success).toBe(false);
    });

    it("on delete", async () => {
      const { token, plan } = await createSavingPlan();

      const response = await api()
        .delete(`/api/saving-plans/${plan.id}`)
        .set("Authorization", `Bearer ${token}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });

  // The password is checked before ownership, so a plan belonging to someone
  // else answers 403 rather than 404 when the password is also wrong. Worth
  // pinning: it is the one ordering that does not leak whether the plan exists.
  it("refuses a wrong password before revealing a missing plan", async () => {
    const { token } = await login();

    const response = await api()
      .delete("/api/saving-plans/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`)
      .send({ password: WRONG_PASSWORD });

    expect(response.status).toBe(403);
  });

  it("allows the action once the password is right", async () => {
    const { token, plan } = await createSavingPlan();

    const response = await api()
      .patch(`/api/saving-plans/${plan.id}/deposit`)
      .set("Authorization", `Bearer ${token}`)
      .send({ amount: 100, password: TEST_USER.password });

    expect(response.status).toBe(200);

    expect(response.body.data.currently_deposited).toBe("100.00");
  });
});
