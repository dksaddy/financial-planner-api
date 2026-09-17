import morgan from "morgan";

import { env } from "../config/env.js";

// One JSON object per line in production, so a log platform can index the
// fields; the readable `dev` shape everywhere else, with the request id added.
const isProduction = () => env.nodeEnv === "production";

morgan.token("id", (req) => req.id);

// Render's health check hits this every few seconds; logging each one would
// bury the lines that matter. A failing check still
// shows up, as a non-2xx.
const skipHealthyPings = (req, res) =>
  req.originalUrl.startsWith("/api/health") && res.statusCode < 400;

export const accessLog = () =>
  isProduction()
    ? morgan((tokens, req, res) =>
        JSON.stringify({
          level: "info",
          type: "access",
          time: new Date().toISOString(),
          requestId: tokens.id(req, res),
          method: tokens.method(req, res),
          url: tokens.url(req, res),
          status: Number(tokens.status(req, res)),
          responseTimeMs: Number(tokens["response-time"](req, res)),
          contentLength: tokens.res(req, res, "content-length") ?? null,
          // The user id only, never the token or the email.
          userId: req.user?.id ?? null,
        }),
        { skip: skipHealthyPings }
      )
    : morgan(":id :method :url :status :response-time ms - :res[content-length]", {
        skip: skipHealthyPings,
      });

// Errors carry the stack in development and in the structured line alike: they
// are server-side only, the client never sees them.
export const logError = (error, req) => {
  if (isProduction()) {
    console.error(
      JSON.stringify({
        level: "error",
        time: new Date().toISOString(),
        requestId: req?.id ?? null,
        userId: req?.user?.id ?? null,
        method: req?.method,
        url: req?.originalUrl,
        name: error?.name,
        message: error?.message,
        code: error?.code,
        stack: error?.stack,
      })
    );

    return;
  }

  console.error(`[${req?.id ?? "-"}]`, error);
};
