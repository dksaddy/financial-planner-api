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

// Whether any expense record points at the type. `EXISTS` stops at the first
// match rather than counting the lot, and it is what the client needs to know
// to decide if deleting is still on the table.
const IS_USED_COLUMN = `
  EXISTS (
    SELECT 1
    FROM expense_records
    WHERE expense_type_id = expense_types.id
  ) AS is_used
`;

export const findAllByUserId = async (userId, isActive) => {
  const filterByStatus = isActive !== undefined;

  const result = await query(
    `
    SELECT
      expense_types.*,
      ${IS_USED_COLUMN}
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
    SELECT
      expense_types.*,
      ${IS_USED_COLUMN}
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

// The delete and the "is it used" check are one statement on purpose.
// expense_records.expense_type_id is ON DELETE CASCADE, so a separate
// check-then-delete would destroy records silently if one were created in
// between. Returning no row means it was either not found or still in use —
// the service tells those apart.
export const removeIfUnused = async (id, userId) => {
  const result = await query(
    `
    DELETE FROM expense_types
    WHERE id=$1
      AND user_id=$2
      AND NOT EXISTS (
        SELECT 1
        FROM expense_records
        WHERE expense_type_id=$1
      )
    RETURNING *;
    `,
    [id, userId]
  );

  return result.rows[0] ?? null;
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
