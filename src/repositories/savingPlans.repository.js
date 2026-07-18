import { query } from "../db/query.js";

export const create = async (userId, data) => {
  const result = await query(
    `
    INSERT INTO saving_plans
    (
      user_id,
      name,
      amount,
      frequency,
      months,
      deposit_amount,
      deposit_frequency,
      withdrawal_amount
    )
    VALUES
    (
      $1,$2,$3,$4,$5,$6,$7,$8
    )
    RETURNING *;
    `,
    [
      userId,
      data.name,
      data.amount,
      data.frequency,
      data.months,
      data.depositAmount,
      data.depositFrequency,
      data.withdrawalAmount,
    ]
  );

  return result.rows[0];
};

export const findAllByUserId = async (userId) => {
  const result = await query(
    `
    SELECT *
    FROM saving_plans
    WHERE user_id = $1
    ORDER BY created_at DESC;
    `,
    [userId]
  );

  return result.rows;
};

export const findById = async (id, userId) => {
  const result = await query(
    `
    SELECT *
    FROM saving_plans
    WHERE id = $1
    AND user_id = $2;
    `,
    [id, userId]
  );

  return result.rows[0];
};

export const update = async (id, userId, data) => {
  const result = await query(
    `
    UPDATE saving_plans
    SET
      name = $3,
      amount = $4,
      frequency = $5,
      months = $6,
      deposit_amount = $7,
      deposit_frequency = $8,
      withdrawal_amount = $9,
      updated_at = NOW()
    WHERE id = $1
      AND user_id = $2
    RETURNING *;
    `,
    [
      id,
      userId,
      data.name,
      data.amount,
      data.frequency,
      data.months,
      data.depositAmount,
      data.depositFrequency,
      data.withdrawalAmount,
    ]
  );

  return result.rows[0];
};

export const remove = async (id, userId) => {
  const result = await query(
    `
    DELETE FROM saving_plans
    WHERE id = $1
    AND user_id = $2
    RETURNING *;
    `,
    [id, userId]
  );

  return result.rows[0];
};