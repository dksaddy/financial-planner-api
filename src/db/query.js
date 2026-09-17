import { AsyncLocalStorage } from "node:async_hooks";

import { pool } from "../config/database.js";

// The client of the transaction the current call chain is running inside, if
// any. Repositories keep calling `query` exactly as before: inside
// `withUserLock` it goes to that transaction's client, outside it to the pool.
// That is what lets a service put a check and the write it guards in one
// transaction without every repository function growing a `client` argument.
const transaction = new AsyncLocalStorage();

export const query = async (text, params = []) => {
  const client = transaction.getStore();

  return (client ?? pool).query(text, params);
};

/**
 * Runs `work` in a transaction holding a per-user advisory lock, so two
 * requests for the same user that check a cap and then write — a week's
 * records, an album's photos, the Extra Save a target spends — run one after
 * the other instead of both passing the check.
 *
 * `pg_advisory_xact_lock` is released by COMMIT or ROLLBACK, so the lock can
 * never outlive the transaction, and it is transaction-scoped rather than
 * session-scoped, which is what the transaction pooler (DB_PORT 6543) allows.
 * Other users are never blocked: the key is the user id.
 *
 * Nested calls reuse the outer transaction rather than opening a second one.
 */
export const withUserLock = async (userId, work) => {
  if (transaction.getStore()) {
    return work();
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      "SELECT pg_advisory_xact_lock(hashtextextended($1, 0))",
      [String(userId)]
    );

    const result = await transaction.run(client, work);

    await client.query("COMMIT");

    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});

    throw error;
  } finally {
    client.release();
  }
};
