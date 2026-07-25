import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import {
  login,
  loginSecondUser,
} from "../helpers/auth.helper.js";
import { createTarget } from "../helpers/target.helper.js";

describe("PUT /api/target/:id", () => {
  it("should update a target", async () => {
    const { token } = await login();

    const target = await createTarget(token);

    const response = await api()
      .put(`/api/target/${target.id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Gaming Laptop",
        target_amount: 100000,
        status: "completed",
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe(
      "Gaming Laptop"
    );
  });

  it("should reject unauthenticated request", async () => {
    const { token } = await login();

    const target = await createTarget(token);

    const response = await api()
      .put(`/api/target/${target.id}`)
      .send({
        name: "Gaming Laptop",
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("should return 404 if target does not exist", async () => {
    const { token } = await login();

    const response = await api()
      .put("/api/target/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Gaming Laptop",
      });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });

  it("should not allow another user to update the target", async () => {
    const { token } = await login();

    const target = await createTarget(token);

    const { token: secondToken } =
      await loginSecondUser();

    const response = await api()
      .put(`/api/target/${target.id}`)
      .set("Authorization", `Bearer ${secondToken}`)
      .send({
        name: "Hacked",
      });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
  });
});