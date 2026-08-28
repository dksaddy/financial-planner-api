import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import {
  login,
  loginSecondUser,
} from "../helpers/auth.helper.js";
import { createSavingPlan } from "../helpers/savingPlan.helper.js";

describe("Saving Plans Authorization", () => {
  it("should not allow another user to view a saving plan", async () => {
    const { token: ownerToken } = await login();

    const { plan } = await createSavingPlan(ownerToken);

    const { token: otherToken } =
      await loginSecondUser();

    const response = await api()
      .get(`/api/saving-plans/${plan.id}`)
      .set(
        "Authorization",
        `Bearer ${otherToken}`
      );

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("should not allow another user to update a saving plan", async () => {
    const { token: ownerToken } = await login();

    const { plan } = await createSavingPlan(ownerToken);

    const { token: otherToken } =
      await loginSecondUser();

    const response = await api()
      .put(`/api/saving-plans/${plan.id}`)
      .set(
        "Authorization",
        `Bearer ${otherToken}`
      )
      .send({
        name: "Hacked",
        amount: 9999,
        frequency: 30,
        months: 12,
        depositAmount: 1000,
        depositFrequency: 30,
        withdrawalAmount: 0,
      });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("should not allow another user to delete a saving plan", async () => {
    const { token: ownerToken } = await login();

    const { plan } = await createSavingPlan(ownerToken);

    const { token: otherToken } =
      await loginSecondUser();

    const response = await api()
      .delete(`/api/saving-plans/${plan.id}`)
      .set(
        "Authorization",
        `Bearer ${otherToken}`
      );

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("should not allow another user to deposit into a saving plan", async () => {
    const { token: ownerToken } = await login();

    const { plan } = await createSavingPlan(ownerToken);

    const { token: otherToken } =
      await loginSecondUser();

    const response = await api()
      .patch(`/api/saving-plans/${plan.id}/deposit`)
      .set(
        "Authorization",
        `Bearer ${otherToken}`
      )
      .send({ amount: 100 });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});