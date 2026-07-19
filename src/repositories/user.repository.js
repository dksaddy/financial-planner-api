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

export const updateProfile = async (id, data) => {
  const updates = [];
  const values = [];
  let index = 1;

  if (data.name !== undefined) {
    updates.push(`name = $${index++}`);
    values.push(data.name);
  }

  if (data.email !== undefined) {
    updates.push(`email = $${index++}`);
    values.push(data.email);
  }

  if (data.salary !== undefined) {
    updates.push(`salary = $${index++}`);
    values.push(data.salary);
  }

  if (data.avatar_url !== undefined) {
    updates.push(`avatar_url = $${index++}`);
    values.push(data.avatar_url);
  }

  updates.push(`updated_at = NOW()`);

  values.push(id);

  const { rows } = await query(
    `
    UPDATE users
    SET ${updates.join(", ")}
    WHERE id = $${index}
    RETURNING
      id,
      name,
      email,
      salary,
      avatar_url,
      created_at,
      updated_at
    `,
    values
  );

  return rows[0];
};

export const emailExists = async (
  email,
  excludeUserId
) => {
  const { rows } = await query(
    `
    SELECT id
    FROM users
    WHERE email = $1
    AND id <> $2
    LIMIT 1
    `,
    [email, excludeUserId]
  );

  return rows.length > 0;
};

export const updateAvatar = async (id, avatarUrl) => {
  const { rows } = await query(
    `
    UPDATE users
    SET
      avatar_url = $2,
      updated_at = NOW()
    WHERE id = $1
    RETURNING
      id,
      name,
      email,
      salary,
      avatar_url,
      created_at,
      updated_at
    `,
    [id, avatarUrl]
  );

  return rows[0];
};