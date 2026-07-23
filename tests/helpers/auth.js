import request from "supertest";
import app from "../../src/app.js";

export async function login() {
  const response = await request(app)
    .post("/api/auth/login")
    .send({
      email: "test@example.com",
      password: "password123",
    });

  return response.body.data.token;
}