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