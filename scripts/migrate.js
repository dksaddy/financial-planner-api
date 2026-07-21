import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import { pool } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationsDir = path.join(
  __dirname,
  "..",
  "migrations"
);

async function migrate() {
  const client = await pool.connect();

  try {
    console.log("Connected to database.");

    // Read migration files
    const files = await fs.readdir(migrationsDir);

    const migrationFiles = files
      .filter(file => file.endsWith(".sql"))
      .sort();

    console.log(
      `Found ${migrationFiles.length} migration(s).`
    );

    // Create migrations table if missing
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Already executed
    const { rows } = await client.query(
      `SELECT filename FROM migrations`
    );

    const executed = new Set(
      rows.map(row => row.filename)
    );

    for (const file of migrationFiles) {

      if (executed.has(file)) {
        console.log(`Skipping ${file}`);
        continue;
      }

      console.log(`Running ${file}`);

      const sql = await fs.readFile(
        path.join(migrationsDir, file),
        "utf8"
      );

      await client.query("BEGIN");

      await client.query(sql);

      await client.query(
        `
        INSERT INTO migrations(filename)
        VALUES($1)
        `,
        [file]
      );

      await client.query("COMMIT");

      console.log(`Finished ${file}`);
    }

    console.log("All migrations completed.");
  } catch (error) {

    await client.query("ROLLBACK");

    console.error(error);

    process.exit(1);

  } finally {

    client.release();

    await pool.end();

  }
}

migrate();