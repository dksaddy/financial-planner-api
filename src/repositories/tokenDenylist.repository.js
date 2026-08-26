import { query } from "../db/query.js";

export const revoke = async ({ jti, userId, expiresAt }) => {
  await query(
    `
    INSERT INTO token_denylist
    (
      jti,
      user_id,
      expires_at
    )
    VALUES ($1,$2,$3)
    ON CONFLICT (jti) DO NOTHING
    `,
    [jti, userId, expiresAt]
  );
};

export const isRevoked = async (jti) => {
  const { rows } = await query(
    `
    SELECT 1
    FROM token_denylist
    WHERE jti=$1
    LIMIT 1
    `,
    [jti]
  );

  return rows.length > 0;
};