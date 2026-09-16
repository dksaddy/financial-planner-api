import { randomUUID } from "node:crypto";

import { api } from "./request.helper.js";
import { TEST_USER, SECOND_USER } from "./constants.js";

export async function login() {
  const response = await api()
    .post("/api/auth/login")
    .send(TEST_USER);

  return {
    token: response.body.data.token,
    user: response.body.data.user,
  };
}

export async function loginSecondUser() {
  const response = await api()
    .post("/api/auth/login")
    .send(SECOND_USER);

  return {
    token: response.body.data.token,
    user: response.body.data.user,
  };
}

// A brand-new user with the seeded users' password, for tests that change
// something user-global (working days, the plans feeding the dashboard) and
// must not move figures other test files assert on for the seeded user.
export async function registerFreshUser() {
  const response = await api()
    .post("/api/auth/register")
    .send({
      name: "Fresh User",
      email: `fresh-${randomUUID()}@example.com`,
      password: TEST_USER.password,
    });

  return {
    token: response.body.data.token,
    user: response.body.data.user,
  };
}
