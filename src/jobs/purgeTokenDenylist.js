import * as tokenDenylistRepository from "../repositories/tokenDenylist.repository.js";

// Hourly is plenty: a token lives for days, so an expired row sitting an extra
// hour costs nothing, and the delete is one indexed statement.
const INTERVAL_MS = 60 * 60 * 1000;

const purge = async () => {
  try {
    const removed = await tokenDenylistRepository.purgeExpired();

    if (removed > 0) {
      console.log(`Purged ${removed} expired token denylist row(s)`);
    }
  } catch (error) {
    // A missed purge only leaves rows for the next run, so it must never take
    // the server down.
    console.error("Token denylist purge failed:", error);
  }
};

// Runs once at start-up, then on the interval. `unref` so the timer alone never
// keeps the process alive — a shutdown does not have to wait for it.
export const startTokenDenylistPurge = () => {
  purge();

  setInterval(purge, INTERVAL_MS).unref();
};
