import { api } from "./request.helper.js";
import { login } from "./auth.helper.js";

export async function createSavingPlan(overrides = {}) {
  const { token } = await login();

  const payload = {
    name: "Emergency Fund",
    amount: 5000,
    frequency: 7,
    months: 12,
    depositAmount: 500,
    depositFrequency: 7,
    withdrawalAmount: 0,
    ...overrides,
  };

  const response = await api()
    .post("/api/saving-plans")
    .set("Authorization", `Bearer ${token}`)
    .send(payload);

  return {
    token,
    plan: response.body.data,
  };
}