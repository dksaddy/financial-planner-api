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