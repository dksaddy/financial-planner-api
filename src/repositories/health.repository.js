import { query } from "../db/query.js";

// The cheapest statement that proves a pooled connection can reach the
// database and get an answer back. Not user-scoped: there is no user here.
export const ping = async () => {
  await query("SELECT 1");
};
