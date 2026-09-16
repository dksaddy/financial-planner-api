import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import { TEST_USER } from "../helpers/constants.js";
import { registerFreshUser } from "../helpers/auth.helper.js";
import { createSavingPlan } from "../helpers/savingPlan.helper.js";

const planBody = (overrides = {}) => ({
  name: "Taxed Plan",
  amount: 1000,
  frequency: 30,
  months: 10,
  depositAmount: 10000,
  depositFrequency: 10,
  withdrawalAmount: 12000,
  password: TEST_USER.password,
  ...overrides,
});

const dashboardPlan = async (token, id) => {
  const response = await api()
    .get("/api/dashboard")
    .set("Authorization", `Bearer ${token}`);

  return response.body.data.saving.plans.find((plan) => plan.id === id);
};

// Each case uses its own user: an active plan feeds the seeded user's budget,
// which other test files assert on.
describe("Saving plan tax rate", () => {
  it("should default a new plan to 15%", async () => {
    const { token } = await registerFreshUser();

    const { plan } = await createSavingPlan(token);

    expect(Number(plan.tax_rate)).toBe(15);
  });

  it("should store the plan's own rate and tax its profit with it", async () => {
    const { token } = await registerFreshUser();

    const { plan } = await createSavingPlan(token, planBody({ taxRate: 7.5 }));

    expect(Number(plan.tax_rate)).toBe(7.5);

    expect(await dashboardPlan(token, plan.id)).toMatchObject({
      taxRate: 7.5,
      profit: 2000,
      tax: 150,
      inHand: 11850,
      netProfit: 1850,
    });
  });

  it("should charge no tax on a loss", async () => {
    const { token } = await registerFreshUser();

    const { plan } = await createSavingPlan(
      token,
      planBody({ withdrawalAmount: 9000, taxRate: 20 })
    );

    expect(await dashboardPlan(token, plan.id)).toMatchObject({
      profit: -1000,
      tax: 0,
      inHand: 9000,
      netProfit: -1000,
    });
  });

  it("should change the rate on update and keep it when left out", async () => {
    const { token } = await registerFreshUser();

    const { plan } = await createSavingPlan(token, planBody());

    const changed = await api()
      .put(`/api/saving-plans/${plan.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send(planBody({ taxRate: 10 }));

    expect(changed.status).toBe(200);
    expect(Number(changed.body.data.tax_rate)).toBe(10);

    const kept = await api()
      .put(`/api/saving-plans/${plan.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send(planBody({ name: "Renamed" }));

    expect(kept.status).toBe(200);
    expect(Number(kept.body.data.tax_rate)).toBe(10);
  });

  it("should reject a rate outside 0 to 100", async () => {
    const { token } = await registerFreshUser();

    for (const taxRate of [-1, 100.5]) {
      const response = await api()
        .post("/api/saving-plans")
        .set("Authorization", `Bearer ${token}`)
        .send(planBody({ taxRate }));

      expect(response.status).toBe(400);
      expect(response.body.errors[0].message).toBe(
        "Tax rate must be between 0 and 100"
      );
    }
  });
});
