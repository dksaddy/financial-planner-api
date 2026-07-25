import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import {
  login,
  loginSecondUser,
} from "../helpers/auth.helper.js";
import { createTarget } from "../helpers/target.helper.js";

describe("DELETE /api/target/:id", () => {
  it("should delete a target", async () => {
    const { token } = await login();

    const target = await createTarget(token);

    const response = await api()
      .delete(`/api/target/${target.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    const check = await api()
      .get(`/api/target/${target.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(check.status).toBe(404);
  });

  it("should reject unauthenticated request", async () => {
    const { token } = await login();

    const target = await createTarget(token);

    const response = await api()
      .delete(`/api/target/${target.id}`);

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("should return 404 if target does not exist", async () => {
    const { token } = await login();

    const response = await api()
      .delete("/api/target/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("should not allow another user to delete the target", async () => {
    const { token } = await login();

    const target = await createTarget(token);

    const { token: secondToken } =
      await loginSecondUser();

    const response = await api()
      .delete(`/api/target/${target.id}`)
      .set("Authorization", `Bearer ${secondToken}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});