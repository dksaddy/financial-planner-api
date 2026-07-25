import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import {
  login,
  loginSecondUser,
} from "../helpers/auth.helper.js";
import { createTarget } from "../helpers/target.helper.js";

describe("GET /api/target/:id", () => {
  it("should return a target by id", async () => {
    const { token } = await login();

    const target = await createTarget(token);

    const response = await api()
      .get(`/api/target/${target.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(target.id);
  });

  it("should return 404 if target does not exist", async () => {
    const { token } = await login();

    const response = await api()
      .get("/api/target/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("should not allow another user to access the target", async () => {
    const { token } = await login();

    const target = await createTarget(token);

    const { token: secondToken } =
      await loginSecondUser();

    const response = await api()
      .get(`/api/target/${target.id}`)
      .set("Authorization", `Bearer ${secondToken}`);

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});