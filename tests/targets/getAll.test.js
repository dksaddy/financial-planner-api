import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import { login } from "../helpers/auth.helper.js";
import { createTarget } from "../helpers/target.helper.js";

describe("GET /api/target", () => {
  it("should return all targets", async () => {
    const { token } = await login();

    await createTarget(token);

    const response = await api()
      .get("/api/target")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it("should reject unauthenticated request", async () => {
    const response = await api().get("/api/target");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });
});