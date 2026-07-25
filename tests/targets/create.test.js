import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import {
  login,
  loginSecondUser,
} from "../helpers/auth.helper.js";

describe("POST /api/target", () => {
  it("should create a target", async () => {
    const { token } = await login();

    const response = await api()
      .post("/api/target")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "Laptop",
        target_amount: 80000,
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe(
      "Target created successfully"
    );
    expect(response.body.data.name).toBe("Laptop");
  });

  it("should reject unauthenticated request", async () => {
    const response = await api()
      .post("/api/target")
      .send({
        name: "Laptop",
        target_amount: 80000,
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("should reject invalid request body", async () => {
    const { token } = await login();

    const response = await api()
      .post("/api/target")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "",
        target_amount: -100,
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});