import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import {
  login,
  loginSecondUser,
} from "../helpers/auth.helper.js";
import { createExpenseType } from "../helpers/expenseType.helper.js";
import { nextExpenseDate } from "../helpers/expenseRecord.helper.js";

describe("DELETE /api/expense-types/:id", () => {
  it("should delete an unused expense type", async () => {
    const { token, expenseType } = await createExpenseType();

    const response = await api()
      .delete(`/api/expense-types/${expenseType.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(200);

    const check = await api()
      .get(`/api/expense-types/${expenseType.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(check.status).toBe(404);
  });

  it("should refuse to delete a type an expense record uses", async () => {
    const { token, expenseType } = await createExpenseType();

    const record = await api()
      .post("/api/expense-records")
      .set("Authorization", `Bearer ${token}`)
      .send({
        expense_type_id: expenseType.id,
        date: nextExpenseDate(),
      });

    expect(record.status).toBe(201);

    const response = await api()
      .delete(`/api/expense-types/${expenseType.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(409);

    // The foreign key is ON DELETE CASCADE, so a refused delete that somehow
    // went through would take the record with it. Prove it did not.
    const check = await api()
      .get(`/api/expense-records/${record.body.data.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(check.status).toBe(200);
  });

  it("should reject unauthenticated request", async () => {
    const { expenseType } = await createExpenseType();

    const response = await api().delete(
      `/api/expense-types/${expenseType.id}`
    );

    expect(response.status).toBe(401);
  });

  it("should return 404 if the type does not exist", async () => {
    const { token } = await login();

    const response = await api()
      .delete("/api/expense-types/00000000-0000-0000-0000-000000000000")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
  });

  it("should not allow another user to delete", async () => {
    const { expenseType } = await createExpenseType();

    const { token } = await loginSecondUser();

    const response = await api()
      .delete(`/api/expense-types/${expenseType.id}`)
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(404);
  });
});
