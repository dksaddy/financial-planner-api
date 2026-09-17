import { describe, it, expect } from "vitest";

import { api } from "../helpers/request.helper.js";
import { TEST_USER } from "../helpers/constants.js";
import { registerFreshUser } from "../helpers/auth.helper.js";
import { createSavingPlan } from "../helpers/savingPlan.helper.js";

const planBody = (overrides = {}) => ({
  name: "Profit Plan",
  amount: 1000,
  frequency: 30,
  months: 10,
  depositAmount: 10000,
  depositFrequency: 10,
  withdrawalAmount: 12000,
  password: TEST_USER.password,
  ...overrides,
});

const saving = async (token) => {
  const response = await api()
    .get("/api/dashboard")
    .set("Authorization", `Bearer ${token}`);

  return response.body.data.saving;
};

// Each case uses its own user: these figures are totals over every plan the
// user has, so a plan left behind by another test file would move them.
describe("Dashboard saving profit", () => {
  it("should report the profit, its tax and what is left after it", async () => {
    const { token } = await registerFreshUser();

    await createSavingPlan(token, planBody({ taxRate: 10 }));

    expect(await saving(token)).toMatchObject({
      totalDeposit: 10000,
      totalWithdrawal: 12000,
      profit: 2000,
      tax: 200,
      netProfit: 1800,
    });
  });

  it("should charge each plan its own rate and tax no plan that lost money", async () => {
    const { token } = await registerFreshUser();

    await createSavingPlan(token, planBody({ taxRate: 10 }));

    // Withdraws less than it took in, so it pays no tax — and its loss must
    // not reduce the tax the first plan owes.
    await createSavingPlan(
      token,
      planBody({
        name: "Losing Plan",
        depositAmount: 5000,
        withdrawalAmount: 4000,
        taxRate: 50,
      })
    );

    expect(await saving(token)).toMatchObject({
      profit: 1000,
      tax: 200,
      netProfit: 800,
    });
  });

  it("should leave a withdrawn plan out of all three", async () => {
    const { token } = await registerFreshUser();

    const { plan } = await createSavingPlan(token, planBody({ taxRate: 10 }));

    const setStatus = (status) =>
      api()
        .patch(`/api/saving-plans/${plan.id}/status`)
        .set("Authorization", `Bearer ${token}`)
        .send({ status, password: TEST_USER.password });

    // Withdrawn is only reachable through completed.
    expect((await setStatus("completed")).status).toBe(200);
    expect((await setStatus("withdrawn")).status).toBe(200);

    expect(await saving(token)).toMatchObject({
      profit: 0,
      tax: 0,
      netProfit: 0,
    });
  });
});
