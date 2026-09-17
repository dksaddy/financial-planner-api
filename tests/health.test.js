import { describe, it, expect } from "vitest";

import { api } from "./helpers/request.helper.js";

describe("GET /api/health", () => {
  it("should report the API and its database up, without a token", async () => {
    const response = await api().get("/api/health");

    expect(response.status).toBe(200);
    expect(response.headers["cache-control"]).toBe("no-store");
    expect(response.body.data).toMatchObject({
      status: "ok",
      database: "up",
    });
    expect(response.body.data.uptimeSeconds).toEqual(expect.any(Number));
  });
});
