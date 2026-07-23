import { Pool } from "pg";
import { env } from "./env.js";

export const pool = new Pool({
  host: env.db.host,
  port: env.db.port,
  database: env.db.database,
  user: env.db.user,
  password: env.db.password,

  ssl:
    env.nodeEnv === "production"
      ? { rejectUnauthorized: false }
      : false,

  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err);
});