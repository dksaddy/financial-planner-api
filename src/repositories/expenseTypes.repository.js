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

export const findAllByUserId = async (userId, isActive) => {
  const filterByStatus = isActive !== undefined;

  const result = await query(
    `
    SELECT *
    FROM expense_types
    WHERE user_id=$1
    ${filterByStatus ? "AND is_active=$2" : ""}
    ORDER BY created_at DESC;
    `,
    filterByStatus ? [userId, isActive] : [userId]
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

// `total` is deliberately absent from the SET list: an expense type's
// total is frozen once created, because expense_records snapshot it.
export const update = async (id, userId, data) => {
  const result = await query(
    `
    UPDATE expense_types
    SET
      name=$3,
      categories=$4,
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
    ]
  );

  return result.rows[0];
};

export const updateStatus = async (id, userId, isActive) => {
  const result = await query(
    `
    UPDATE expense_types
    SET
      is_active=$3,
      updated_at=NOW()
    WHERE id=$1
      AND user_id=$2
    RETURNING *;
    `,
    [id, userId, isActive]
  );

  return result.rows[0];
};
