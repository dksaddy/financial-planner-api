import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import { login } from "../helpers/auth.helper.js";
import { createSavingPlan } from "../helpers/savingPlan.helper.js";

describe("GET /api/saving-plans", () => {
  it("should return all saving plans", async () => {
    await createSavingPlan();

    const { token } = await login();

    const response = await api()
      .get("/api/saving-plans")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(Array.isArray(response.body.data)).toBe(true);

    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it("should reject unauthenticated request", async () => {
    const response = await api().get("/api/saving-plans");

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
  });

  it("should return an array", async () => {
    const { token } = await login();

    const response = await api()
      .get("/api/saving-plans")
      .set("Authorization", `Bearer ${token}`);

    expect(Array.isArray(response.body.data)).toBe(true);
  });
});