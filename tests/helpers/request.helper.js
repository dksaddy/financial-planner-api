import request from "supertest";
import app from "../../src/app.js";

export function api() {
  return request(app);
}