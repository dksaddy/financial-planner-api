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