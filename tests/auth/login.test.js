import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import { TEST_USER } from "../helpers/constants.js";

describe("POST /api/auth/login", () => {
  it("should login successfully", async () => {
    const response = await api()
      .post("/api/auth/login")
      .send(TEST_USER);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe("Login successful");

    expect(response.body.data).toHaveProperty("token");

    expect(response.body.data.user.email).toBe(
      TEST_USER.email
    );
  });

  it("should normalize the email before looking the user up", async () => {
    const response = await api()
      .post("/api/auth/login")
      .send({
        ...TEST_USER,
        email: `  ${TEST_USER.email.toUpperCase()} `,
      });

    expect(response.status).toBe(200);
  });

  // An existing password is checked for presence only, so a short wrong one
  // is refused by the credential check rather than by validation — the
  // response must not reveal the password policy.
  it("should answer a short wrong password as bad credentials", async () => {
    const response = await api()
      .post("/api/auth/login")
      .send({ email: TEST_USER.email, password: "123" });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Invalid email or password");
  });
});