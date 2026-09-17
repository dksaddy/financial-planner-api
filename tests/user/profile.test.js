import { describe, it, expect } from "vitest";

import { api } from "../helpers/request.helper.js";
import { registerFreshUser } from "../helpers/auth.helper.js";

const updateProfile = (token, body) =>
  api()
    .put("/api/users/profile")
    .set("Authorization", `Bearer ${token}`)
    .send(body);

describe("GET /api/users/profile", () => {
  it("should return the signed-in user without secrets", async () => {
    const { token, user } = await registerFreshUser();

    const response = await api()
      .get("/api/users/profile")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.email).toBe(user.email);
    expect(response.body.data.time_zone).toBe("UTC");
    expect(response.body.data).not.toHaveProperty("password");
    expect(response.body.data).not.toHaveProperty("password_changed_at");
  });
});

describe("PUT /api/users/profile", () => {
  it("should update the name and salary", async () => {
    const { token } = await registerFreshUser();

    const response = await updateProfile(token, {
      name: "Renamed User",
      salary: 45000,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe("Renamed User");
    expect(response.body.data.salary).toBe("45000.00");
  });

  it("should normalize the email before saving it", async () => {
    const { token, user } = await registerFreshUser();

    const response = await updateProfile(token, {
      email: `  ${user.email.toUpperCase()} `,
    });

    expect(response.status).toBe(200);
    expect(response.body.data.email).toBe(user.email);
  });

  it("should refuse an email another account uses", async () => {
    const { token } = await registerFreshUser();
    const { user: other } = await registerFreshUser();

    const response = await updateProfile(token, { email: other.email });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe("Email already exists");
  });

  it("should store a real time zone", async () => {
    const { token } = await registerFreshUser();

    const response = await updateProfile(token, { time_zone: "Asia/Dhaka" });

    expect(response.status).toBe(200);
    expect(response.body.data.time_zone).toBe("Asia/Dhaka");
  });

  it("should refuse a made-up time zone", async () => {
    const { token } = await registerFreshUser();

    const response = await updateProfile(token, { time_zone: "Mars/Olympus" });

    expect(response.status).toBe(400);
  });

  it("should refuse an empty update", async () => {
    const { token } = await registerFreshUser();

    const response = await updateProfile(token, {});

    expect(response.status).toBe(400);
  });
});

describe("POST /api/auth/register time zone", () => {
  it("should start the account in the zone it was registered from", async () => {
    const response = await api()
      .post("/api/auth/register")
      .send({
        name: "Zoned User",
        email: `zoned-${Date.now()}@example.com`,
        password: "password123",
        time_zone: "America/New_York",
      });

    expect(response.status).toBe(201);
    expect(response.body.data.user.time_zone).toBe("America/New_York");
  });
});
