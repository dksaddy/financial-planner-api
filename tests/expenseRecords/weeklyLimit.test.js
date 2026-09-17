import { describe, it, expect } from "vitest";

import { api } from "../helpers/request.helper.js";
import { registerFreshUser } from "../helpers/auth.helper.js";
import { createExpenseType } from "../helpers/expenseType.helper.js";

// A week runs Saturday to Friday — the same week `dashboard.repository`
// spells in SQL — and a new user works six days of it (migration 014's
// default), so the seventh record in a week is the one that is refused.
//
// The week is in the past, because a record cannot be dated ahead of today.
//
// Every test registers its own user rather than logging in as the seeded one:
// the seeded user's weeks already hold records from the seed and from whatever
// else has run against this database, and a test that has to fill a week
// exactly cannot share them.
const SATURDAY = "2024-01-06";

const WEEK = [
  SATURDAY,
  "2024-01-07",
  "2024-01-08",
  "2024-01-09",
  "2024-01-10",
  "2024-01-11",
  "2024-01-12", // Friday, the seventh day
];

const NEXT_WEEK_SATURDAY = "2024-01-13";

const WEEK_FULL_MESSAGE =
  "That week already has 6 expense records, one for each of your 6 working days";

const post = (token, expenseTypeId, date) =>
  api()
    .post("/api/expense-records")
    .set("Authorization", `Bearer ${token}`)
    .send({ expense_type_id: expenseTypeId, date });

const put = (token, id, expenseTypeId, date) =>
  api()
    .put(`/api/expense-records/${id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ expense_type_id: expenseTypeId, date });

// Saturday through Thursday: the week's six working days, leaving Friday free.
const fillWeek = async (token, expenseTypeId) => {
  const records = [];

  for (const date of WEEK.slice(0, 6)) {
    const response = await post(token, expenseTypeId, date);

    expect(response.status).toBe(201);

    records.push(response.body.data);
  }

  return records;
};

describe("expense records weekly limit", () => {
  it("should reject a seventh record in a six-day week", async () => {
    const { token } = await registerFreshUser();
    const { expenseType } = await createExpenseType(token);

    await fillWeek(token, expenseType.id);

    const response = await post(token, expenseType.id, WEEK[6]);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(WEEK_FULL_MESSAGE);
  });

  it("should count each week separately", async () => {
    const { token } = await registerFreshUser();
    const { expenseType } = await createExpenseType(token);

    await fillWeek(token, expenseType.id);

    // The next Saturday opens a week of its own, which is still empty.
    const response = await post(
      token,
      expenseType.id,
      NEXT_WEEK_SATURDAY
    );

    expect(response.status).toBe(201);
  });

  it("should let a record move within its own full week", async () => {
    const { token } = await registerFreshUser();
    const { expenseType } = await createExpenseType(token);

    const [saturday] = await fillWeek(token, expenseType.id);

    // Six records, moving one of them onto the week's free day. The week is
    // full, but not one record fuller for it — this is what the update path
    // excludes the record being moved for.
    const response = await put(
      token,
      saturday.id,
      expenseType.id,
      WEEK[6]
    );

    expect(response.status).toBe(200);
    expect(response.body.data.date).toBe(WEEK[6]);
  });

  it("should reject moving a record into a full week", async () => {
    const { token } = await registerFreshUser();
    const { expenseType } = await createExpenseType(token);

    await fillWeek(token, expenseType.id);

    const other = await post(
      token,
      expenseType.id,
      NEXT_WEEK_SATURDAY
    );

    expect(other.status).toBe(201);

    const response = await put(
      token,
      other.body.data.id,
      expenseType.id,
      WEEK[6]
    );

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(WEEK_FULL_MESSAGE);
  });

  it("should follow the user's own working days", async () => {
    const { token } = await registerFreshUser();
    const { expenseType } = await createExpenseType(token);

    const profile = await api()
      .put("/api/users/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ working_days_per_week: 3 });

    expect(profile.status).toBe(200);

    for (const date of WEEK.slice(0, 3)) {
      expect((await post(token, expenseType.id, date)).status).toBe(201);
    }

    const response = await post(token, expenseType.id, WEEK[3]);

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      "That week already has 3 expense records, one for each of your 3 working days"
    );
  });
});

describe("expense records weekly limit under concurrency", () => {
  it("should let only as many racing creates through as the week has days", async () => {
    const { token } = await registerFreshUser();
    const { expenseType } = await createExpenseType(token);

    await api()
      .put("/api/users/profile")
      .set("Authorization", `Bearer ${token}`)
      .send({ working_days_per_week: 2 });

    const responses = await Promise.all(
      WEEK.map((date) => post(token, expenseType.id, date))
    );

    const statuses = responses.map((response) => response.status);

    expect(statuses.filter((status) => status === 201)).toHaveLength(2);
    expect(statuses.filter((status) => status === 400)).toHaveLength(5);
  });
});
