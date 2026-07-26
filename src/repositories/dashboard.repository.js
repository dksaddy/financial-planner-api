import { query } from "../db/query.js";

export const getDashboardSummary = async (userId) => {
  const sql = `
    SELECT
      u.salary,

      COALESCE(SUM(sp.deposit_amount), 0) AS total_deposit,
      COALESCE(SUM(sp.withdrawal_amount), 0) AS total_withdrawal,

      COALESCE(
        SUM(
          CASE
            WHEN sp.frequency = 7 THEN sp.amount
            ELSE 0
          END
        ),
        0
      ) AS weekly_saving,

      COALESCE(
        SUM(
          CASE
            WHEN sp.frequency = 30 THEN sp.amount
            ELSE 0
          END
        ),
        0
      ) AS monthly_saving

    FROM users u
    LEFT JOIN saving_plans sp
      ON sp.user_id = u.id
      AND sp.status = 'active'

    WHERE u.id = $1

    GROUP BY u.salary;
  `;

  const { rows } = await query(sql, [userId]);

  return rows[0];
};

export const getPendingTargets = async (userId) => {
  const sql = `
    SELECT
      id,
      name,
      target_amount,
      status,
      created_at
    FROM targets
    WHERE user_id = $1
      AND status = 'pending'
    ORDER BY created_at DESC;
  `;

  const { rows } = await query(sql, [userId]);

  return rows;
};

export const getTopExpenseTypes = async (userId) => {
  const sql = `
    SELECT
      et.id,
      et.name,
      COUNT(er.id) AS frequency,
      COALESCE(SUM(er.total), 0) AS total_amount

    FROM expense_records er
    INNER JOIN expense_types et
      ON et.id = er.expense_type_id

    WHERE er.user_id = $1

    GROUP BY
      et.id,
      et.name

    ORDER BY
      COUNT(er.id) DESC,
      SUM(er.total) DESC

    LIMIT 3;
  `;

  const { rows } = await query(sql, [userId]);

  return rows;
};