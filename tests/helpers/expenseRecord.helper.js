import { api } from "./request.helper.js";
import { login } from "./auth.helper.js";
import { createExpenseType } from "./expenseType.helper.js";

export async function createExpenseRecord(token = null, overrides = {}) {
  if (!token) {
    const loginResult = await login();
    token = loginResult.token;
  }

  const { expenseType } = await createExpenseType(token);

  const payload = {
    expense_type_id: expenseType.id,
    date: "2026-07-15",
    ...overrides,
  };

  const response = await api()
    .post("/api/expense-records")
    .set("Authorization", `Bearer ${token}`)
    .send(payload);

  return {
    token,
    expenseRecord: response.body.data,
    expenseType,
  };
}