import { describe, it, expect } from "vitest";

import { api } from "../helpers/request.helper.js";
import { TEST_USER } from "../helpers/constants.js";
import { registerFreshUser } from "../helpers/auth.helper.js";

// Every case registers its own user: a password change ends the account's
// other sessions, and the seeded user's sessions are what every other test
// file signs in with.

const NEW_PASSWORD = "a-brand-new-password";

const changePassword = (token, body) =>
  api()
    .put("/api/users/change-password")
    .set("Authorization", `Bearer ${token}`)
    .send({
      oldPassword: TEST_USER.password,
      newPassword: NEW_PASSWORD,
      confirmPassword: NEW_PASSWORD,
      ...body,
    });

const me = (token) =>
  api().get("/api/auth/me").set("Authorization", `Bearer ${token}`);

const login = (email, password) =>
  api().post("/api/auth/login").send({ email, password });

describe("PUT /api/users/change-password", () => {
  it("should change the password and return a working session", async () => {
    const { token, user } = await registerFreshUser();

    const response = await changePassword(token);

    expect(response.status).toBe(200);
    expect(response.body.data.token).toEqual(expect.any(String));
    expect(response.body.data.user.email).toBe(user.email);

    expect((await me(response.body.data.token)).status).toBe(200);

    expect((await login(user.email, NEW_PASSWORD)).status).toBe(200);
    expect((await login(user.email, TEST_USER.password)).status).toBe(401);
  });

  it("should end every session opened before the change", async () => {
    const { token, user } = await registerFreshUser();

    // A second device, signed in before the change.
    const other = await login(user.email, TEST_USER.password);
    const otherToken = other.body.data.token;

    expect((await me(otherToken)).status).toBe(200);

    const response = await changePassword(token);

    expect(response.status).toBe(200);

    expect((await me(otherToken)).status).toBe(401);
    // Including the one the change was made with.
    expect((await me(token)).status).toBe(401);
  });

  it("should refuse a wrong old password with 403 and change nothing", async () => {
    const { token, user } = await registerFreshUser();

    const response = await changePassword(token, {
      oldPassword: "not-the-password",
    });

    expect(response.status).toBe(403);
    expect(response.body.message).toBe("Old password is incorrect");

    // The session survives a mistyped confirmation.
    expect((await me(token)).status).toBe(200);
    expect((await login(user.email, TEST_USER.password)).status).toBe(200);
  });

  it("should refuse a new password equal to the old one", async () => {
    const { token } = await registerFreshUser();

    const response = await changePassword(token, {
      newPassword: TEST_USER.password,
      confirmPassword: TEST_USER.password,
    });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual({
      field: "newPassword",
      message: "New password must be different from the current password",
    });
  });

  it("should refuse a confirmation that does not match", async () => {
    const { token } = await registerFreshUser();

    const response = await changePassword(token, {
      confirmPassword: "something-else-entirely",
    });

    expect(response.status).toBe(400);
    expect(response.body.errors).toContainEqual({
      field: "confirmPassword",
      message: "Passwords do not match",
    });
  });
});
