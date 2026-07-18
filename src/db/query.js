import { query } from "../db/query.js";

const result = await query(
  "SELECT * FROM users WHERE id = $1",
  [id]
);