import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import { login } from "../helpers/auth.helper.js";
import { createSavingPlan } from "../helpers/savingPlan.helper.js";

describe("DELETE /api/saving-plans/:id", () => {
  it("should delete a saving plan", async () => {
    const { token, plan } = await createSavingPlan();

    const response = await api()
      .delete(`/api/saving-plans/${plan.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect(response.body.success).toBe(true);

    // Verify it's actually deleted
    const check = await api()
      .get(`/api/saving-plans/${plan.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(check.status).toBe(404);
  });

  it("should reject unauthenticated request", async () => {
    const { plan } = await createSavingPlan();

    const response = await api().delete(
      `/api/saving-plans/${plan.id}`
    );

    expect(response.status).toBe(401);

    expect(response.body.success).toBe(false);
  });

  it("should return 404 if saving plan does not exist", async () => {
    const { token } = await login();

    const response = await api()
      .delete("/api/saving-plans/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);

    expect(response.body.success).toBe(false);
  });
});
