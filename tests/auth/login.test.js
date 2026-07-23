import request from "supertest";
import app from "../../src/app.js";

describe("POST /api/auth/login", () => {
  it("should login successfully", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: "test@example.com",
        password: "password123",
      });

    expect(response.statusCode).toBe(200);

    expect(response.body.success).toBe(true);

    expect(response.body.data.token).toBeDefined();
  });
});