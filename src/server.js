import app from "./app.js";
import { env } from "./config/env.js";
import { pool } from "./config/database.js";
import { startTokenDenylistPurge } from "./jobs/purgeTokenDenylist.js";
import { startKeepAlive } from "./jobs/keepAlive.js";

const startServer = async () => {
  try {
    const client = await pool.connect();

    await client.query("SELECT NOW()");

    console.log("✅ PostgreSQL Connected");

    client.release();

    app.listen(env.port, () => {
      console.log(`🚀 Server running on port ${env.port}`);
    });

    startTokenDenylistPurge();
    startKeepAlive();
  } catch (error) {
    console.error("❌ Failed to connect to PostgreSQL");
    console.error(error);
    process.exit(1);
  }
};

startServer();