import { query } from "../db/query.js";

export const upsertForDate = async (
  userId,
  date,
  { budgetAmount, spentAmount }
) => {
  const extraAmount = budgetAmount - spentAmount;

  const result = await query(
    `
    INSERT INTO daily_extra_savings
    (
      user_id,
      date,
      budget_amount,
      spent_amount,
      extra_amount
    )
    VALUES ($1,$2,$3,$4,$5)
    ON CONFLICT (user_id, date)
    DO UPDATE SET
      budget_amount = EXCLUDED.budget_amount,
      spent_amount = EXCLUDED.spent_amount,
      extra_amount = EXCLUDED.extra_amount,
      updated_at = NOW()
    RETURNING *;
    `,
    [userId, date, budgetAmount, spentAmount, extraAmount]
  );

  return result.rows[0];
};

export const removeForDate = async (userId, date) => {
  const result = await query(
    `
    DELETE FROM daily_extra_savings
    WHERE
        user_id=$1
        AND date=$2
    RETURNING *;
    `,
    [userId, date]
  );

  return result.rows[0] ?? null;
};

export const findByDates = async (userId, dates) => {
  if (!dates.length) return [];

  const result = await query(
    `
    SELECT *
    FROM daily_extra_savings
    WHERE
        user_id=$1
        AND date = ANY($2::date[]);
    `,
    [userId, dates]
  );

  return result.rows;
};

// Sums the stored daily figures over the same window the expense list is
// filtered by. Deliberately not the dashboard's Extra Save: that one also
// subtracts what completed targets have spent, which is a whole-account
// figure and has no place in a per-month expense summary.
export const sumExtraAmount = async (userId, month) => {
  const params = [userId];

  let filter = "";

  if (month) {
    const [year, monthNumber] = month.split("-").map(Number);

    const start = new Date(Date.UTC(year, monthNumber - 1, 1));
    const end = new Date(Date.UTC(year, monthNumber, 1));

    params.push(
      start.toISOString().slice(0, 10),
      end.toISOString().slice(0, 10)
    );

    filter = `AND date >= $${params.length - 1} AND date < $${params.length}`;
  }

  const result = await query(
    `
    SELECT COALESCE(SUM(extra_amount), 0)::numeric(12,2) AS total
    FROM daily_extra_savings
    WHERE user_id=$1
    ${filter};
    `,
    params
  );

  return result.rows[0].total;
};

export const getTotalExtraSave = async (userId) => {
  const result = await query(
    `
    SELECT
        COALESCE(SUM(extra_amount), 0) AS total
    FROM daily_extra_savings
    WHERE user_id=$1;
    `,
    [userId]
  );

  return Number(result.rows[0].total);
};

export const findByDateRange = async (
  userId,
  startDate,
  endDate
) => {
  const result = await query(
    `
    SELECT *
    FROM daily_extra_savings
    WHERE
        user_id=$1
        AND date BETWEEN $2 AND $3
    ORDER BY date ASC;
    `,
    [userId, startDate, endDate]
  );

  return result.rows;
};