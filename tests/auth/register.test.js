import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";

describe("POST /api/auth/register", () => {
  it("should register a new user", async () => {
    const response = await api()
      .post("/api/auth/register")
      .send({
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
      });

    expect(response.status).toBe(201);

    expect(response.body.success).toBe(true);

    expect(response.body.data).toHaveProperty("id");

    expect(response.body.data.email).toBe(
      "john@example.com"
    );
  });

  it("should reject duplicate email", async () => {
    const response = await api()
      .post("/api/auth/register")
      .send({
        name: "Another User",
        email: "test@example.com",
        password: "password123",
      });

    expect(response.status).toBe(409);

    expect(response.body.success).toBe(false);
  });

  it("should reject invalid request body", async () => {
    const response = await api()
      .post("/api/auth/register")
      .send({
        name: "",
        email: "abc",
        password: "123",
      });

    expect(response.status).toBe(400);

    expect(response.body.success).toBe(false);
  });
});