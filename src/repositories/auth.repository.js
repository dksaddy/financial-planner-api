import { query } from "../db/query.js";

export const findUserByEmail = async (email) => {
  const result = await query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );

  return result.rows[0];
};

export const createUser = async ({ name, email, password }) => {
  const result = await query(
    `
      INSERT INTO users(name,email,password)
      VALUES($1,$2,$3)
      RETURNING id,name,email,created_at
    `,
    [name, email, password]
  );

  return result.rows[0];
};