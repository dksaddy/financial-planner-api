import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import { login } from "../helpers/auth.helper.js";
import { createSavingPlan } from "../helpers/savingPlan.helper.js";

describe("GET /api/saving-plans/:id", () => {
  it("should return a saving plan by id", async () => {
    const { token, plan } = await createSavingPlan();

    const response = await api()
      .get(`/api/saving-plans/${plan.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data.id).toBe(plan.id);

    expect(response.body.data.name).toBe(plan.name);
  });

  it("should return 404 if saving plan does not exist", async () => {
    const { token } = await login();

    const response = await api()
      .get("/api/saving-plans/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);

    expect(response.body.success).toBe(false);
  });

  it("should reject unauthenticated request", async () => {
    const { plan } = await createSavingPlan();

    const response = await api().get(
      `/api/saving-plans/${plan.id}`
    );

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
  });
});