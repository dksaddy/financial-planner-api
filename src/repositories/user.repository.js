// repositories/user.repository.js

import { query } from "../db/query.js";

export const findByEmail = async (email) => {
  const result = await query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );

  return result.rows[0];
};

export const create = async ({ name, email, password }) => {
  const result = await query(
    `
    INSERT INTO users (name, email, password)
    VALUES ($1, $2, $3)
    RETURNING id, name, email, created_at
    `,
    [name, email, password]
  );

  return result.rows[0];
};

export const findById = async (id) => {
  const { rows } = await query(
    `
    SELECT
      id,
      name,
      email,
      salary,
      avatar_url,
      created_at,
      updated_at
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );

  return rows[0] ?? null;
};