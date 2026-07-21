import { pool } from "./db.js";

async function reset() {
  const client = await pool.connect();

  try {
    console.log("Connected.");

    await client.query("BEGIN");

    console.log("Dropping tables...");

    await client.query(`
      DROP TABLE IF EXISTS
        expense_records,
        expense_types,
        saving_plans,
        targets,
        users,
        migrations
      CASCADE;
    `);

    await client.query("COMMIT");

    console.log("Database reset successfully.");
  } catch (error) {

    await client.query("ROLLBACK");

    console.error(error);

    process.exit(1);

  } finally {

    client.release();

    await pool.end();

  }
}

reset();