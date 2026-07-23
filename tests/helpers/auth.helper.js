import request from "supertest";
import app from "../../src/app.js";
import { TEST_USER } from "./constants.js";

export async function login() {
  const response = await request(app)
    .post("/api/auth/login")
    .send(TEST_USER);

  return response.body.data.token;
}