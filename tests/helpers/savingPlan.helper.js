import { api } from "./request.helper.js";
import { login } from "./auth.helper.js";
import { TEST_USER } from "./constants.js";

export async function createSavingPlan(
  token = null,
  overrides = {}
) {
  if (!token) {
    const auth = await login();
    token = auth.token;
  }

  const payload = {
    name: "Emergency Fund",
    amount: 5000,
    frequency: 7,
    months: 12,
    depositAmount: 500,
    depositFrequency: 7,
    withdrawalAmount: 0,
    // Every saving-plan mutation is password-confirmed. Overridable, so a test
    // can still exercise a wrong or missing one.
    password: TEST_USER.password,
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