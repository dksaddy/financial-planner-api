import { query } from "../db/query.js";

export const getDashboardSummary = async (userId) => {
  const sql = `
    SELECT
      u.salary,
      u.working_days_per_month,
      u.working_days_per_week,

      -- Summary totals count active and completed plans. Withdrawn plans
      -- are paid out and finished, so they live only on the saving plans
      -- page.
      COALESCE(
        SUM(
          CASE WHEN sp.status <> 'withdrawn' THEN sp.deposit_amount ELSE 0 END
        ),
        0
      ) AS total_deposit,

      COALESCE(
        SUM(
          CASE WHEN sp.status <> 'withdrawn' THEN sp.withdrawal_amount ELSE 0 END
        ),
        0
      ) AS total_withdrawal,

      -- Recurring weekly/monthly saving is money still being put aside, so
      -- only ACTIVE plans count. It feeds calculateBudget, which drives the
      -- Spending, Progress and Saving Breakdown cards and each day's stored
      -- budget.
      COALESCE(
        SUM(
          CASE
            WHEN sp.status = 'active' AND sp.frequency = 7 THEN sp.amount
            ELSE 0
          END
        ),
        0
      ) AS weekly_saving,

      COALESCE(
        SUM(
          CASE
            WHEN sp.status = 'active' AND sp.frequency = 30 THEN sp.amount
            ELSE 0
          END
        ),
        0
      ) AS monthly_saving

    FROM users u
    LEFT JOIN saving_plans sp
      ON sp.user_id = u.id

    WHERE u.id = $1

    GROUP BY u.id;
  `;

  const { rows } = await query(sql, [userId]);

  return rows[0];
};

// The three figures `calculateProfit` needs, for the same set the summary
// totals above count: every plan that has not been withdrawn. Tax is charged
// per plan and only on a gain, so the totals cannot be a `SUM` over the whole
// set — the rows come back and the service folds each one through that
// function, which is the only place the maths lives.
export const getSavingPlanFigures = async (userId) => {
  const sql = `
    SELECT
      deposit_amount,
      withdrawal_amount,
      tax_rate
    FROM saving_plans
    WHERE user_id = $1
      AND status <> 'withdrawn';
  `;

  const { rows } = await query(sql, [userId]);

  return rows;
};

export const getSavingPlans = async (userId) => {
  const sql = `
    SELECT
      id,
      name,
      amount,
      frequency,
      months,
      deposit_amount,
      deposit_frequency,
      currently_deposited,
      withdrawal_amount,
      tax_rate,
      status,
      created_at
    FROM saving_plans
    WHERE user_id = $1
      -- Only active plans are listed; completed ones still count in the
      -- summary figures above but no longer take deposits.
      AND status = 'active'
    ORDER BY created_at DESC;
  `;

  const { rows } = await query(sql, [userId]);

  return rows;
};

export const getPendingTargets = async (userId) => {
  const sql = `
    SELECT
      id,
      name,
      target_amount,
      image_url,
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

    LIMIT 4;
  `;

  const { rows } = await query(sql, [userId]);

  return rows;
};

// "Today" in both week queries is the user's own day, read in their
// `time_zone`, not the database server's CURRENT_DATE — otherwise the week
// rolls over at the wrong local hour for anyone far from the server.
const USER_TODAY = `(
  NOW() AT TIME ZONE (SELECT time_zone FROM users WHERE id = $1)
)::date`;

export const getCurrentWeekExpenses = async (userId) => {
  const sql = `
    WITH week_range AS (
      SELECT
        (
          ${USER_TODAY} -
          (
            CASE
              WHEN EXTRACT(DOW FROM ${USER_TODAY}) = 6 THEN 0
              WHEN EXTRACT(DOW FROM ${USER_TODAY}) = 0 THEN 1
              WHEN EXTRACT(DOW FROM ${USER_TODAY}) = 1 THEN 2
              WHEN EXTRACT(DOW FROM ${USER_TODAY}) = 2 THEN 3
              WHEN EXTRACT(DOW FROM ${USER_TODAY}) = 3 THEN 4
              WHEN EXTRACT(DOW FROM ${USER_TODAY}) = 4 THEN 5
              WHEN EXTRACT(DOW FROM ${USER_TODAY}) = 5 THEN 6
            END
          ) * INTERVAL '1 day'
        )::date AS week_start
    )

    SELECT
      er.id,
      er.date,
      er.total,
      et.id AS expense_type_id,
      et.name AS expense_type_name

    FROM expense_records er

    JOIN expense_types et
      ON et.id = er.expense_type_id

    CROSS JOIN week_range wr

    WHERE er.user_id = $1
      AND er.date BETWEEN wr.week_start
                      AND wr.week_start + INTERVAL '5 day'

    ORDER BY er.date ASC;
  `;

  const { rows } = await query(sql, [userId]);

  return rows;
};

export const getLastFourWeeksExpenses = async (userId) => {
  const sql = `
    WITH current_week AS (
      SELECT (
        ${USER_TODAY} -
        CASE EXTRACT(DOW FROM ${USER_TODAY})
          WHEN 6 THEN 0 -- Saturday
          WHEN 0 THEN 1 -- Sunday
          WHEN 1 THEN 2 -- Monday
          WHEN 2 THEN 3 -- Tuesday
          WHEN 3 THEN 4 -- Wednesday
          WHEN 4 THEN 5 -- Thursday
          WHEN 5 THEN 6 -- Friday
        END
      )::date AS current_week_start
    )

    SELECT
      er.id,
      er.date::text AS date,
      er.total,
      et.name AS type_name,

      CASE
        -- Previous Week
        WHEN er.date BETWEEN
          (cw.current_week_start - INTERVAL '7 day')::date
          AND
          (cw.current_week_start - INTERVAL '2 day')::date
        THEN 1

        -- 2 Weeks Ago
        WHEN er.date BETWEEN
          (cw.current_week_start - INTERVAL '14 day')::date
          AND
          (cw.current_week_start - INTERVAL '9 day')::date
        THEN 2

        -- 3 Weeks Ago
        WHEN er.date BETWEEN
          (cw.current_week_start - INTERVAL '21 day')::date
          AND
          (cw.current_week_start - INTERVAL '16 day')::date
        THEN 3

        -- 4 Weeks Ago
        WHEN er.date BETWEEN
          (cw.current_week_start - INTERVAL '28 day')::date
          AND
          (cw.current_week_start - INTERVAL '23 day')::date
        THEN 4
      END AS week_number

    FROM expense_records er
    JOIN expense_types et
      ON et.id = er.expense_type_id
    CROSS JOIN current_week cw

    WHERE
      er.user_id = $1

      -- Ignore Friday completely
      AND EXTRACT(DOW FROM er.date) <> 5

      -- Last four completed weeks only
      AND er.date >= (cw.current_week_start - INTERVAL '28 day')::date
      AND er.date <= (cw.current_week_start - INTERVAL '2 day')::date

    ORDER BY
      week_number,
      er.date;
  `;

  const { rows } = await query(sql, [userId]);

  return rows;
};