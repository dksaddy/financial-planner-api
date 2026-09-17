import { HTTP_STATUS } from "../constants/httpStatus.js";
import { COMMON_MESSAGES } from "../constants/messages.js";
import { env } from "../config/env.js";
import { logError } from "../utils/logger.js";

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

  // Only trust messages from our own operational errors (AppError).
  // Anything else (raw DB errors, unexpected exceptions, third-party
  // library errors) could contain internal details, so we hide it
  // behind a generic message instead of sending it to the client.
  const message = err.isOperational
    ? err.message
    : COMMON_MESSAGES.INTERNAL_SERVER_ERROR;

  // Always log the real error server-side so nothing is lost for debugging.
  if (!err.isOperational) {
    logError(err, req);
  } else if (env.nodeEnv !== "production") {
    console.error(`[${req.id ?? "-"}]`, err.message);
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
};

export default errorHandler;