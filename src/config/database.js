import pg from "pg";
import { env } from "./env.js";

const { Pool, types } = pg;

// Postgres OID 1082 = the `date` type.
//
// By default `pg` converts `date` columns into JS `Date` objects using
// the *server process's local timezone* (e.g. `new Date(2026, 8, 6)`).
// When that object is later serialized with `res.json()`, `toISOString()`
// always converts to UTC. If the server's local timezone is AHEAD of UTC
// (e.g. Asia/Dhaka, +6), local midnight becomes the previous day in UTC
// (`2026-09-05T18:00:00.000Z` instead of `2026-09-06`), silently shifting
// every plain "calendar date" back by one day.
//
// `date` columns have no time-of-day or timezone component in Postgres,
// so there is nothing to gain from turning them into `Date` objects —
// only risk. Returning the raw "YYYY-MM-DD" string keeps the value
// exactly as stored, independent of server or client timezone.
types.setTypeParser(1082, (value) => value);

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