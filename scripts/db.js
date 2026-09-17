import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  // Same rule as src/config/database.js. Without it `npm run migrate` on
  // Render connects in plain text and a database that enforces SSL refuses it.
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL error:", err);
});