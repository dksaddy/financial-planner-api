import { api } from "./request.helper.js";

export async function createTarget(token, overrides = {}) {
  const payload = {
    name: "Emergency Fund",
    target_amount: 50000,
    ...overrides,
  };

  const response = await api()
    .post("/api/target")
    .set("Authorization", `Bearer ${token}`)
    .send(payload);

  return response.body.data;
}