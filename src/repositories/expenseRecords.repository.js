import { query } from "../db/query.js";

export const create = async (userId, data) => {
  const result = await query(
    `
    INSERT INTO expense_records
    (
        user_id,
        expense_type_id,
        date,
        total
    )
    VALUES
    (
        $1,$2,$3,$4
    )
    RETURNING *;
    `,
    [
      userId,
      data.expense_type_id,
      data.date,
      data.total,
    ]
  );

  return result.rows[0];
};

// A month filter is expressed as a half-open date range rather than a
// to_char() comparison, so the (user_id, date) index still applies.
const monthRange = (month) => {
  const [year, monthNumber] = month.split("-").map(Number);

  const start = new Date(Date.UTC(year, monthNumber - 1, 1));
  const end = new Date(Date.UTC(year, monthNumber, 1));

  return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
};

// Same-date rows need a tiebreaker, otherwise a row can be shown twice or
// skipped entirely as the offset moves across pages.
const ORDER_BY = "ORDER BY er.date DESC, er.created_at DESC, er.id DESC";

export const findPageByUserId = async (
  userId,
  { limit, offset, month }
) => {
  const params = [userId];

  let filter = "";

  if (month) {
    const [start, end] = monthRange(month);

    params.push(start, end);

    filter = `AND er.date >= $${params.length - 1} AND er.date < $${params.length}`;
  }

  params.push(limit, offset);

  const result = await query(
    `
    SELECT
        er.*,
        et.name AS expense_type_name
    FROM expense_records er
    JOIN expense_types et
        ON et.id = er.expense_type_id
    WHERE er.user_id = $1
    ${filter}
    ${ORDER_BY}
    LIMIT $${params.length - 1}
    OFFSET $${params.length};
    `,
    params
  );

  return result.rows;
};

// Totals describe the whole filtered set, not the page — the client cannot
// derive either from ten rows.
export const summarizeByUserId = async (userId, { month } = {}) => {
  const params = [userId];

  let filter = "";

  if (month) {
    const [start, end] = monthRange(month);

    params.push(start, end);

    filter = `AND er.date >= $${params.length - 1} AND er.date < $${params.length}`;
  }

  const result = await query(
    `
    SELECT
        COUNT(*)::int AS total,
        COALESCE(SUM(er.total), 0)::numeric(12,2) AS total_amount
    FROM expense_records er
    WHERE er.user_id = $1
    ${filter};
    `,
    params
  );

  return result.rows[0];
};

// Every month the user has a record in, newest first — the month filter
// tabs cannot be built from a single page of results.
export const findMonthsByUserId = async (userId) => {
  const result = await query(
    `
    SELECT DISTINCT to_char(er.date, 'YYYY-MM') AS month
    FROM expense_records er
    WHERE er.user_id = $1
    ORDER BY month DESC;
    `,
    [userId]
  );

  return result.rows.map((row) => row.month);
};

export const findById = async (id, userId) => {
  const result = await query(
    `
    SELECT
        er.*,
        et.name AS expense_type_name
    FROM expense_records er
    JOIN expense_types et
        ON et.id = er.expense_type_id
    WHERE
        er.id = $1
        AND er.user_id = $2;
    `,
    [id, userId]
  );

  return result.rows[0];
};

export const update = async (id, userId, data) => {
  const result = await query(
    `
    UPDATE expense_records
    SET
        expense_type_id=$3,
        date=$4,
        total=$5
    WHERE
        id=$1
        AND user_id=$2
    RETURNING *;
    `,
    [
      id,
      userId,
      data.expense_type_id,
      data.date,
      data.total,
    ]
  );

  return result.rows[0];
};

export const remove = async (id, userId) => {
  const result = await query(
    `
    DELETE FROM expense_records
    WHERE
        id=$1
        AND user_id=$2
    RETURNING *;
    `,
    [id, userId]
  );

  return result.rows[0];
};

// Returns the count alongside the sum because the two mean different things
// to the caller: a day with no records at all must drop its extra-saving row,
// while a day whose records happen to total 0 must keep one.
export const summarizeDay = async (userId, date) => {
  const result = await query(
    `
    SELECT
        COUNT(*) AS count,
        COALESCE(SUM(total), 0) AS total
    FROM expense_records
    WHERE
        user_id=$1
        AND date=$2;
    `,
    [userId, date]
  );

  return {
    count: Number(result.rows[0].count),
    total: Number(result.rows[0].total),
  };
};