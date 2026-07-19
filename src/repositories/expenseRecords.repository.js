import { query } from "../db/query.js";

export const create = async (userId, data) => {
  const result = await query(
    `
    INSERT INTO expense_records
    (
        user_id,
        expense_type_id,
        date,
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
      data.expense_type_id,
      data.date,
      data.total,
    ]
  );

  return result.rows[0];
};

export const findAllByUserId = async (userId) => {
  const result = await query(
    `
    SELECT
        er.*,
        et.name AS expense_type_name
    FROM expense_records er
    JOIN expense_types et
        ON et.id = er.expense_type_id
    WHERE er.user_id = $1
    ORDER BY er.date DESC;
    `,
    [userId]
  );

  return result.rows;
};

export const findById = async (id, userId) => {
  const result = await query(
    `
    SELECT
        er.*,
        et.name AS expense_type_name
    FROM expense_records er
    JOIN expense_types et
        ON et.id = er.expense_type_id
    WHERE
        er.id = $1
        AND er.user_id = $2;
    `,
    [id, userId]
  );

  return result.rows[0];
};

export const update = async (id, userId, data) => {
  const result = await query(
    `
    UPDATE expense_records
    SET
        expense_type_id=$3,
        date=$4,
        total=$5
    WHERE
        id=$1
        AND user_id=$2
    RETURNING *;
    `,
    [
      id,
      userId,
      data.expense_type_id,
      data.date,
      data.total,
    ]
  );

  return result.rows[0];
};

export const remove = async (id, userId) => {
  const result = await query(
    `
    DELETE FROM expense_records
    WHERE
        id=$1
        AND user_id=$2
    RETURNING *;
    `,
    [id, userId]
  );

  return result.rows[0];
};