import { query } from "../db/query.js";

export const create = async (userId, data) => {
  const result = await query(
    `
    INSERT INTO expense_types
    (
      user_id,
      name,
      categories,
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
      data.name,
      JSON.stringify(data.categories),
      data.total,
    ]
  );

  return result.rows[0];
};

export const findAllByUserId = async (userId) => {
  const result = await query(
    `
    SELECT *
    FROM expense_types
    WHERE user_id=$1
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
    FROM expense_types
    WHERE id=$1
    AND user_id=$2;
    `,
    [id, userId]
  );

  return result.rows[0];
};

export const update = async (id, userId, data) => {
  const result = await query(
    `
    UPDATE expense_types
    SET
      name=$3,
      categories=$4,
      total=$5,
      updated_at=NOW()
    WHERE id=$1
      AND user_id=$2
    RETURNING *;
    `,
    [
      id,
      userId,
      data.name,
      JSON.stringify(data.categories),
      data.total,
    ]
  );

  return result.rows[0];
};

export const remove = async (id, userId) => {
  const result = await query(
    `
    DELETE FROM expense_types
    WHERE id=$1
    AND user_id=$2
    RETURNING *;
    `,
    [id, userId]
  );

  return result.rows[0];
};