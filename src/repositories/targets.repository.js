import { query } from "../db/query.js";

export const create = async ({
  userId,
  name,
  target_amount,
}) => {
  const { rows } = await query(
    `
    INSERT INTO targets
    (
      user_id,
      name,
      target_amount
    )
    VALUES ($1,$2,$3)
    RETURNING *
    `,
    [userId, name, target_amount]
  );

  return rows[0];
};

export const findAllByUser = async (userId) => {
  const { rows } = await query(
    `
    SELECT *
    FROM targets
    WHERE user_id=$1
    ORDER BY created_at DESC
    `,
    [userId]
  );

  return rows;
};

export const findById = async (
  id,
  userId
) => {
  const { rows } = await query(
    `
    SELECT *
    FROM targets
    WHERE id=$1
    AND user_id=$2
    LIMIT 1
    `,
    [id, userId]
  );

  return rows[0] ?? null;
};

export const update = async (
  id,
  userId,
  {
    name,
    target_amount,
    status,
  }
) => {
  const { rows } = await query(
    `
    UPDATE targets
    SET
      name=$3,
      target_amount=$4,
      status=$5,
      updated_at=NOW()
    WHERE id=$1
    AND user_id=$2
    RETURNING *
    `,
    [
      id,
      userId,
      name,
      target_amount,
      status,
    ]
  );

  return rows[0];
};

export const remove = async (
  id,
  userId
) => {
  await query(
    `
    DELETE FROM targets
    WHERE id=$1
    AND user_id=$2
    `,
    [id, userId]
  );
};