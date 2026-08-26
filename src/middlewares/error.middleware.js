import { HTTP_STATUS } from "../constants/httpStatus.js";
import { env } from "../config/env.js";

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;

  // Only trust messages from our own operational errors (AppError).
  // Anything else (raw DB errors, unexpected exceptions, third-party
  // library errors) could contain internal details, so we hide it
  // behind a generic message instead of sending it to the client.
  const message = err.isOperational
    ? err.message
    : "Internal Server Error";

  // Always log the real error server-side so nothing is lost for debugging.
  if (!err.isOperational) {
    console.error(err);
  } else if (env.nodeEnv !== "production") {
    console.error(err.message);
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
};

export default errorHandler;