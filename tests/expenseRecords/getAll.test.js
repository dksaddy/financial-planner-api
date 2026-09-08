import { describe, it, expect } from "vitest";
import { api } from "../helpers/request.helper.js";
import { login } from "../helpers/auth.helper.js";
import { createExpenseRecord } from "../helpers/expenseRecord.helper.js";
import { createExpenseType } from "../helpers/expenseType.helper.js";

const list = (token, queryString = "") =>
  api()
    .get(`/api/expense-records${queryString}`)
    .set("Authorization", `Bearer ${token}`);

// Seed the given dates against one expense type, so ordering and month
// filtering can be asserted without depending on the seeded fixtures.
const seedDates = async (token, dates) => {
  const { expenseType } = await createExpenseType(token);

  for (const date of dates) {
    await api()
      .post("/api/expense-records")
      .set("Authorization", `Bearer ${token}`)
      .send({ expense_type_id: expenseType.id, date });
  }

  return expenseType;
};

describe("GET /api/expense-records", () => {
  it("should return expense records", async () => {
    await createExpenseRecord();

    const { token } = await login();

    const response = await list(token);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it("should reject unauthenticated request", async () => {
    const response = await api().get("/api/expense-records");

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  it("should return an array", async () => {
    const { token } = await login();

    const response = await list(token);

    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it("should default to ten records per page", async () => {
    const { token } = await login();

    const response = await list(token);

    expect(response.body.data.length).toBeLessThanOrEqual(10);
    expect(response.body.meta.pagination.limit).toBe(10);
    expect(response.body.meta.pagination.page).toBe(1);
  });

  it("should report totals for the whole set, not the page", async () => {
    const { token } = await login();

    const response = await list(token);

    const { pagination, summary } = response.body.meta;

    expect(pagination.total).toBeGreaterThan(response.body.data.length);
    expect(pagination.totalPages).toBe(
      Math.ceil(pagination.total / pagination.limit)
    );
    expect(Number(summary.total_amount)).toBeGreaterThan(0);
  });

  it("should honour page and limit", async () => {
    const { token } = await login();

    const first = await list(token, "?page=1&limit=3");
    const second = await list(token, "?page=2&limit=3");

    expect(first.body.data).toHaveLength(3);
    expect(second.body.data).toHaveLength(3);
    expect(second.body.meta.pagination.page).toBe(2);

    const firstIds = first.body.data.map((record) => record.id);
    const secondIds = second.body.data.map((record) => record.id);

    // No row may appear on two pages.
    expect(
      secondIds.some((id) => firstIds.includes(id))
    ).toBe(false);
  });

  it("should paginate a same-date run without repeats or gaps", async () => {
    const { token } = await login();

    // Five records on one date: pagination is stable only if the ordering
    // has a tiebreaker beyond `date`.
    await seedDates(token, [
      "2030-03-04",
      "2030-03-04",
      "2030-03-04",
      "2030-03-04",
      "2030-03-04",
    ]);

    const first = await list(token, "?month=2030-03&limit=2&page=1");
    const second = await list(token, "?month=2030-03&limit=2&page=2");
    const third = await list(token, "?month=2030-03&limit=2&page=3");

    const ids = [
      ...first.body.data,
      ...second.body.data,
      ...third.body.data,
    ].map((record) => record.id);

    expect(ids).toHaveLength(5);
    expect(new Set(ids).size).toBe(5);
  });

  it("should filter by month", async () => {
    const { token } = await login();

    await seedDates(token, ["2031-01-10", "2031-02-11", "2031-02-12"]);

    const response = await list(token, "?month=2031-02");

    expect(response.status).toBe(200);
    expect(response.body.meta.pagination.total).toBe(2);
    expect(
      response.body.data.every((record) =>
        record.date.startsWith("2031-02")
      )
    ).toBe(true);
  });

  it("should list every month the user has records in", async () => {
    const { token } = await login();

    await seedDates(token, ["2032-05-01", "2032-06-01"]);

    const response = await list(token, "?month=2032-05");

    const { months } = response.body.meta;

    // Months are not narrowed by the active filter — the tabs must stay
    // complete while a month is selected.
    expect(months).toContain("2032-05");
    expect(months).toContain("2032-06");
    expect([...months]).toEqual([...months].sort().reverse());
  });

  it("should clamp a page past the end to the last page", async () => {
    const { token } = await login();

    const response = await list(token, "?page=9999&limit=10");

    expect(response.status).toBe(200);
    expect(response.body.meta.pagination.page).toBe(
      response.body.meta.pagination.totalPages
    );
    expect(response.body.data.length).toBeGreaterThan(0);
  });

  it("should return an empty page with totalPages 1 when nothing matches", async () => {
    const { token } = await login();

    const response = await list(token, "?month=1999-01");

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.meta.pagination.total).toBe(0);
    expect(response.body.meta.pagination.totalPages).toBe(1);
    expect(response.body.meta.pagination.hasNext).toBe(false);
  });

  it("should reject invalid pagination params", async () => {
    const { token } = await login();

    const zeroPage = await list(token, "?page=0");
    const hugeLimit = await list(token, "?limit=500");
    const badMonth = await list(token, "?month=2026-13");

    expect(zeroPage.status).toBe(400);
    expect(hugeLimit.status).toBe(400);
    expect(badMonth.status).toBe(400);
  });

  it("should not leak another user's records into the count", async () => {
    const { token } = await login();

    const response = await list(token);

    const ownerIds = new Set(
      response.body.data.map((record) => record.user_id)
    );

    expect(ownerIds.size).toBe(1);
  });
});
