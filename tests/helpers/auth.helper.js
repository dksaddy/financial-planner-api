import { api } from "./request.helper.js";
import { TEST_USER } from "./constants.js";

export async function login() {
  const response = await api()
    .post("/api/auth/login")
    .send(TEST_USER);

  return {
    token: response.body.data.token,
    user: response.body.data.user,
  };
}