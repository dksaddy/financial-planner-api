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

  // Must stay UNDER the server's own client limit, not above it. Supabase's
  // session-mode pooler (port 5432) caps a project at 15 clients, and asking
  // for 20 meant the 16th connection came back as a FATAL
  // `EMAXCONNSESSION: max clients reached in session mode`, not as a wait.
  //
  // Below the ceiling, `pg` queues instead: a request that needs a connection
  // waits for a free one. `/dashboard` alone opens eight at once — seven
  // parallel repository calls plus the nested pair inside getTotalExtraSave —
  // so the headroom also covers pgAdmin, a migration run and a second dev
  // process being connected at the same time.
  //
  // Raising this is the wrong fix for load. Point the app at the transaction
  // pooler (port 6543) instead, which is built for many short-lived clients;
  // nothing here uses named prepared statements, so it is a URL change.
  max: 8,

  // Returned to the pooler sooner than the old 30s, so an idle dev server
  // stops sitting on connections another client could be using.
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err);
});