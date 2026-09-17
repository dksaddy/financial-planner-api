import ApiResponse from "../utils/ApiResponse.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { COMMON_MESSAGES } from "../constants/messages.js";
import { ping } from "../repositories/health.repository.js";

// Not wrapped in asyncHandler: a database failure is the answer here, a 503,
// not an error for the error middleware to turn into a 500.
export const getHealth = async (req, res) => {
  const startedAt = Date.now();

  let database = "up";

  try {
    await ping();
  } catch (error) {
    database = "down";

    console.error(`[${req.id ?? "-"}] Health check database ping failed:`, error.message);
  }

  const healthy = database === "up";
  const statusCode = healthy
    ? HTTP_STATUS.OK
    : HTTP_STATUS.SERVICE_UNAVAILABLE;

  // Never cached — a stale 200 from a proxy would hide an outage.
  res.set("Cache-Control", "no-store");

  return res.status(statusCode).json(
    new ApiResponse(
      statusCode,
      healthy ? COMMON_MESSAGES.HEALTHY : COMMON_MESSAGES.UNHEALTHY,
      {
        status: healthy ? "ok" : "degraded",
        database,
        uptimeSeconds: Math.round(process.uptime()),
        responseTimeMs: Date.now() - startedAt,
        time: new Date().toISOString(),
      }
    )
  );
};
