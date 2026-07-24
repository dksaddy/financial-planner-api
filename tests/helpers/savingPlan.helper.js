import { api } from "./request.helper.js";
import { login } from "./auth.helper.js";

export async function createSavingPlan() {
  const { token } = await login();

  const response = await api()
    .post("/api/saving-plans")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Emergency Fund",
      amount: 5000,
      frequency: 7,
      months: 12,
      depositAmount: 500,
      depositFrequency: 7,
      withdrawalAmount: 0,
    });

  return {
    token,
    plan: response.body.data,
  };
}