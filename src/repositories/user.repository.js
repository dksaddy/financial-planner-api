// repositories/user.repository.js

import { query } from "../db/query.js";

export const findByEmail = async (email) => {
  const result = await query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );

  return result.rows[0];
};

export const create = async ({
  name,
  email,
  password,
  time_zone = "UTC",
}) => {
  const result = await query(
    `
    INSERT INTO users (name, email, password, time_zone)
    VALUES ($1, $2, $3, $4)
    RETURNING
      id,
      name,
      email,
      salary,
      working_days_per_month,
      working_days_per_week,
      time_zone,
      avatar_url,
      created_at
    `,
    [name, email, password, time_zone]
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
      working_days_per_month,
      working_days_per_week,
      time_zone,
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

  if (data.working_days_per_month !== undefined) {
    updates.push(`working_days_per_month = $${index++}`);
    values.push(data.working_days_per_month);
  }

  if (data.working_days_per_week !== undefined) {
    updates.push(`working_days_per_week = $${index++}`);
    values.push(data.working_days_per_week);
  }

  if (data.time_zone !== undefined) {
    updates.push(`time_zone = $${index++}`);
    values.push(data.time_zone);
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
      working_days_per_month,
      working_days_per_week,
      time_zone,
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
      working_days_per_month,
      working_days_per_week,
      time_zone,
      avatar_url,
      created_at,
      updated_at
    `,
    [id, avatarUrl]
  );

  return rows[0];
};

// `changedAt` comes from the app's clock, not the database's NOW(): it is
// compared against a token's issue time, which the app stamped, and the
// database sits on another machine whose clock may not agree.
export const updatePassword = async (id, hashedPassword, changedAt) => {
  const { rows } = await query(
    `
    UPDATE users
    SET
      password = $2,
      password_changed_at = $3,
      updated_at = NOW()
    WHERE id = $1
    RETURNING
      id,
      name,
      email,
      salary,
      working_days_per_month,
      working_days_per_week,
      time_zone,
      avatar_url
    `,
    [id, hashedPassword, changedAt]
  );

  return rows[0];
};

export const findByIdWithPassword = async (id) => {
  const { rows } = await query(
    `
    SELECT
      id,
      password
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );

  return rows[0];
};

// What `authenticate` needs on every request, in one round trip: the user it
// hands on as `req.user`, plus when the password last changed so a token
// issued before that can be refused. The middleware strips the timestamp
// before `req.user` reaches a controller.
export const findSessionUser = async (id) => {
  const { rows } = await query(
    `
    SELECT
      id,
      name,
      email,
      salary,
      working_days_per_month,
      working_days_per_week,
      time_zone,
      avatar_url,
      created_at,
      updated_at,
      password_changed_at
    FROM users
    WHERE id = $1
    LIMIT 1
    `,
    [id]
  );

  return rows[0] ?? null;
};

// Postgres resolves `AT TIME ZONE` against its own zone database, which is not
// guaranteed to match the Intl data the schema checked against. A zone only
// Intl knows would pass validation and then 500 the dashboard, so it is
// confirmed here too.
export const isKnownTimeZone = async (timeZone) => {
  const { rows } = await query(
    `
    SELECT EXISTS (
      SELECT 1 FROM pg_timezone_names WHERE name = $1
    ) AS known
    `,
    [timeZone]
  );

  return rows[0].known;
};
