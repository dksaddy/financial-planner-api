import { describe, it, expect } from "vitest";

import { api } from "../helpers/request.helper.js";
import { TEST_USER } from "../helpers/constants.js";
import { registerFreshUser } from "../helpers/auth.helper.js";
import { createSavingPlan } from "../helpers/savingPlan.helper.js";

const body = (overrides = {}) => ({
  name: "Emergency Fund",
  amount: 5000,
  frequency: 7,
  months: 12,
  depositAmount: 500,
  depositFrequency: 7,
  withdrawalAmount: 0,
  password: TEST_USER.password,
  ...overrides,
});

const update = (token, id, overrides) =>
  api()
    .put(`/api/saving-plans/${id}`)
    .set("Authorization", `Bearer ${token}`)
    .send(body(overrides));

const deposit = (token, id, amount) =>
  api()
    .patch(`/api/saving-plans/${id}/deposit`)
    .set("Authorization", `Bearer ${token}`)
    .send({ amount, password: TEST_USER.password });

const setStatus = (token, id, status) =>
  api()
    .patch(`/api/saving-plans/${id}/status`)
    .set("Authorization", `Bearer ${token}`)
    .send({ status, password: TEST_USER.password });

// A fresh user per case, so no plan here feeds the seeded user's dashboard.
const planWithDeposit = async (depositAmount, deposited) => {
  const { token } = await registerFreshUser();
  const { plan } = await createSavingPlan(token, { depositAmount });

  if (deposited > 0) {
    expect((await deposit(token, plan.id, deposited)).status).toBe(200);
  }

  return { token, plan };
};

describe("PUT /api/saving-plans/:id invariants", () => {
  it("should refuse a deposit target under what is already deposited", async () => {
    const { token, plan } = await planWithDeposit(500, 300);

    const response = await update(token, plan.id, { depositAmount: 299.99 });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "Deposit amount cannot be less than the 300.00 already deposited"
    );
  });

  it("should complete an active plan the new target leaves full", async () => {
    const { token, plan } = await planWithDeposit(500, 300);

    const response = await update(token, plan.id, { depositAmount: 300 });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("completed");
  });

  it("should reopen a full plan whose target is raised", async () => {
    const { token, plan } = await planWithDeposit(500, 500);

    const response = await update(token, plan.id, { depositAmount: 800 });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("active");

    // And it takes deposits again.
    expect((await deposit(token, plan.id, 300)).status).toBe(200);
  });

  it("should keep a plan completed by hand through an edit that does not raise its target", async () => {
    const { token, plan } = await planWithDeposit(500, 100);

    expect((await setStatus(token, plan.id, "completed")).status).toBe(200);

    const response = await update(token, plan.id, { name: "Renamed" });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("completed");
  });

  it("should never move a withdrawn plan", async () => {
    const { token, plan } = await planWithDeposit(500, 500);

    expect((await setStatus(token, plan.id, "withdrawn")).status).toBe(200);

    const response = await update(token, plan.id, { depositAmount: 900 });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("withdrawn");
  });
});
