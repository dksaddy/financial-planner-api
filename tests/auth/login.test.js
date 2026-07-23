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
});