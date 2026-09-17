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

  // `/dashboard` alone opens eight at once — seven parallel repository calls
  // plus the nested pair inside getTotalExtraSave — so this is sized to serve
  // that request without queueing.
  //
  // The ceiling this has to respect belongs to the pooler, and it is shared
  // with every other client of the project. On the session-mode pooler
  // (port 5432) that ceiling is 15, low enough that eight here plus pgAdmin
  // connected alongside crossed it: the refusal arrives as a FATAL
  // `EMAXCONNSESSION: max clients reached in session mode`, which `pg` cannot
  // queue behind or retry, so the query rejects and the request 500s. DB_PORT
  // is the transaction pooler (6543) for that reason — it is built for many
  // short-lived clients. Nothing here uses named prepared statements or
  // session-level state, which is what that mode rules out. `withUserLock` in
  // `db/query.js` does open transactions, which that mode pins to one server
  // connection until COMMIT, and its advisory lock is transaction-scoped for
  // the same reason.
  max: 8,

  // Returned to the pooler sooner than the old 30s, so an idle dev server
  // stops sitting on connections another client could be using.
  idleTimeoutMillis: 10000,

  // The database is across the internet, not on a local socket: every new
  // connection is a round trip plus TLS. 5s was close enough to a cold
  // connect that a slow one failed outright — the request that hit this
  // died at 5003ms with `Connection terminated due to connection timeout`,
  // and the very next one succeeded in 928ms. Waiting is better than a 500.
  connectionTimeoutMillis: 10000,

  // Without this an idle socket can be dropped silently — by the pooler, or
  // by NAT on the way — and pg only discovers it when a query tries to use
  // it, surfacing as `Connection terminated unexpectedly`. Keepalive probes
  // hold the socket open so that stops happening.
  keepAlive: true,
  keepAliveInitialDelayMillis: 5000,
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL pool error:", err);
});