import { randomUUID } from "node:crypto";

import { describe, it, expect } from "vitest";

import { api } from "../helpers/request.helper.js";
import { registerFreshUser } from "../helpers/auth.helper.js";
import { query } from "../../src/db/query.js";
import { purgeExpired } from "../../src/repositories/tokenDenylist.repository.js";

const me = (token) =>
  api().get("/api/auth/me").set("Authorization", `Bearer ${token}`);

describe("POST /api/auth/logout", () => {
  it("should revoke the token it was called with", async () => {
    const { token } = await registerFreshUser();

    const response = await api()
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    expect((await me(token)).status).toBe(401);
  });

  it("should leave the account's other sessions alone", async () => {
    const { token, user } = await registerFreshUser();

    const other = await api()
      .post("/api/auth/login")
      .send({ email: user.email, password: "password123" });

    await api()
      .post("/api/auth/logout")
      .set("Authorization", `Bearer ${token}`);

    expect((await me(other.body.data.token)).status).toBe(200);
  });

  it("should require a token", async () => {
    const response = await api().post("/api/auth/logout");

    expect(response.status).toBe(401);
  });
});

describe("token denylist purge", () => {
  it("should delete expired rows and keep live ones", async () => {
    const { user } = await registerFreshUser();

    const expired = randomUUID();
    const live = randomUUID();

    await query(
      `
      INSERT INTO token_denylist (jti, user_id, expires_at)
      VALUES
        ($1, $3, NOW() - INTERVAL '1 hour'),
        ($2, $3, NOW() + INTERVAL '1 hour')
      `,
      [expired, live, user.id]
    );

    const removed = await purgeExpired();

    expect(removed).toBeGreaterThanOrEqual(1);

    const { rows } = await query(
      `SELECT jti FROM token_denylist WHERE jti = ANY($1::uuid[])`,
      [[expired, live]]
    );

    expect(rows.map((row) => row.jti)).toEqual([live]);
  });
});
