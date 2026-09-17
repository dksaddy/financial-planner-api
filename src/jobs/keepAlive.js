import { env } from "../config/env.js";

// Render's free web services spin down after 15 minutes without inbound
// traffic, and the next visitor waits the best part of a minute for a cold
// start. Pinging our own public URL every 14 minutes counts as inbound
// traffic — it goes out and back in through Render's router — so the service
// never reaches the idle limit.
//
// It can only keep an awake service awake: once asleep, nothing inside the
// process runs. `.github/workflows/keep-alive.yml` pings from outside as the
// backup that can also wake it.
const INTERVAL_MS = 14 * 60 * 1000;
const TIMEOUT_MS = 30 * 1000;

const ping = async (url) => {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { "User-Agent": "financial-planner-api keep-alive" },
    });

    if (!response.ok) {
      console.error(`Keep-alive ping answered ${response.status}`);
    }
  } catch (error) {
    // A missed ping is retried on the next tick; it must never crash the app.
    console.error("Keep-alive ping failed:", error.message);
  }
};

// Production only, and only when there is a public URL to ping. `unref` so the
// timer never holds a shutdown open.
export const startKeepAlive = () => {
  if (env.nodeEnv !== "production" || !env.keepAliveUrl) return;

  const url = `${env.keepAliveUrl.replace(/\/+$/, "")}/api/health`;

  console.log(`Keep-alive pinging ${url} every ${INTERVAL_MS / 60000} minutes`);

  setInterval(() => ping(url), INTERVAL_MS).unref();
};
