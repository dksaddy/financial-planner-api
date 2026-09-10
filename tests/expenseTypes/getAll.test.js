import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import { login } from "../helpers/auth.helper.js";
import { createExpenseType } from "../helpers/expenseType.helper.js";
import { nextExpenseDate } from "../helpers/expenseRecord.helper.js";

describe("GET /api/expense-types", () => {
  it("should return all expense types", async () => {
    await createExpenseType();

    const { token } = await login();

    const response = await api()
      .get("/api/expense-types")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it("should reject unauthenticated request", async () => {
    const response = await api().get("/api/expense-types");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("should return an array", async () => {
    const { token } = await login();

    const response = await api()
      .get("/api/expense-types")
      .set("Authorization", `Bearer ${token}`);

    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it("should include both active and inactive types by default", async () => {
    const { token, expenseType } = await createExpenseType();

    await api()
      .patch(`/api/expense-types/${expenseType.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ is_active: false });

    const response = await api()
      .get("/api/expense-types")
      .set("Authorization", `Bearer ${token}`);

    const ids = response.body.data.map((type) => type.id);

    expect(ids).toContain(expenseType.id);
  });

  it("should exclude inactive types when status=active", async () => {
    const { token, expenseType } = await createExpenseType();

    await api()
      .patch(`/api/expense-types/${expenseType.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ is_active: false });

    const response = await api()
      .get("/api/expense-types?status=active")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.map((type) => type.id)).not.toContain(
      expenseType.id
    );
    expect(
      response.body.data.every((type) => type.is_active === true)
    ).toBe(true);
  });

  it("should return only inactive types when status=inactive", async () => {
    const { token, expenseType } = await createExpenseType();

    await api()
      .patch(`/api/expense-types/${expenseType.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ is_active: false });

    const response = await api()
      .get("/api/expense-types?status=inactive")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.map((type) => type.id)).toContain(
      expenseType.id
    );
    expect(
      response.body.data.every((type) => type.is_active === false)
    ).toBe(true);
  });

  it("should flag whether each type is used by an expense record", async () => {
    const { token, expenseType } = await createExpenseType();

    const before = await api()
      .get("/api/expense-types")
      .set("Authorization", `Bearer ${token}`);

    expect(
      before.body.data.find((type) => type.id === expenseType.id).is_used
    ).toBe(false);

    await api()
      .post("/api/expense-records")
      .set("Authorization", `Bearer ${token}`)
      .send({
        expense_type_id: expenseType.id,
        date: nextExpenseDate(),
      });

    const after = await api()
      .get("/api/expense-types")
      .set("Authorization", `Bearer ${token}`);

    expect(
      after.body.data.find((type) => type.id === expenseType.id).is_used
    ).toBe(true);
  });

  it("should reject an unknown status", async () => {
    const { token } = await login();

    const response = await api()
      .get("/api/expense-types?status=archived")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(400);
  });
});
