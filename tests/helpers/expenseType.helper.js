import { api } from "./request.helper.js";
import { login } from "./auth.helper.js";

export async function createExpenseType(token = null, overrides = {}) {
  if (!token) {
    const loginResult = await login();
    token = loginResult.token;
  }

  const payload = {
    name: "Daily Expense",
    categories: [
      {
        name: "Transport",
        amount: 50,
      },
      {
        name: "Food",
        amount: 100,
      },
    ],
    ...overrides,
  };

  const response = await api()
    .post("/api/expense-types")
    .set("Authorization", `Bearer ${token}`)
    .send(payload);

  return {
    token,
    expenseType: response.body.data,
  };
}