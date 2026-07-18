import { pool } from "../config/database.js";

export const query = async (text, params = []) => {
  return pool.query(text, params);
};