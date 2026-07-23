import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import { login } from "../helpers/auth.helper.js";

describe("GET /api/auth/me", () => {
  it("should return current user", async () => {
    const { token } = await login();
    
    const response = await api()
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data.email).toBe("test@example.com");
  });

  it("should reject request without token", async () => {
    const response = await api().get("/api/auth/me");

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
  });

  it("should reject invalid token", async () => {
    const response = await api()
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid-token");

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
  });
});
