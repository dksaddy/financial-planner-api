import express from "express";
import cors from "cors";
import helmet from "helmet";
import { COMMON_MESSAGES } from "./constants/messages.js";
import authRoutes from "./routes/auth.routes.js";
import notFound from "./middlewares/notFound.middleware.js";
import errorHandler from "./middlewares/error.middleware.js";
import { env } from "./config/env.js";
import requestId from "./middlewares/requestId.middleware.js";
import { accessLog } from "./utils/logger.js";

import savingPlansRoutes from "./routes/savingPlans.routes.js";
import expenseTypesRoutes from "./routes/expenseTypes.routes.js";
import expenseRecordRoutes from "./routes/expenseRecords.routes.js";
import userRoutes from "./routes/user.routes.js";
import targetRoutes from "./routes/targets.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import healthRoutes from "./routes/health.routes.js";

const app = express();

// Render terminates TLS and forwards every request through its own proxy.
// Without this `req.ip` is that proxy's address for every visitor, so the
// login limiter, which keys on the IP, would lock everyone out together after
// five bad attempts from anyone. Trusts exactly as many hops as are configured,
// never blindly, so a client cannot spoof its IP with its own header.
if (env.trustProxy > 0) {
  app.set("trust proxy", env.trustProxy);
}

// Comma-separated list in CORS_ORIGIN supports multiple environments
// (e.g. local dev + deployed frontend) without code changes.
const allowedOrigins = (env.corsOrigin || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser requests (curl, Postman, server-to-server)
      // where there's no Origin header at all.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(COMMON_MESSAGES.CORS_BLOCKED));
    },
    // So a browser client can read the id and quote it when reporting an error.
    exposedHeaders: ["X-Request-Id"],
  })
);
app.use(requestId);
app.use(helmet());
app.use(accessLog());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: COMMON_MESSAGES.API_ROOT,
  });
});

// Unauthenticated and outside every limiter: Render's health check and the
// keep-alive pings both hit it on a timer.
app.use("/api/health", healthRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/saving-plans", savingPlansRoutes);

app.use("/api/expense-types", expenseTypesRoutes);

app.use("/api/expense-records", expenseRecordRoutes);

app.use("/api/users", userRoutes);

app.use("/api/target",targetRoutes);

app.use("/api/dashboard", dashboardRoutes);

// Always last
// 404 Middleware
app.use(notFound);

// Error Middleware (Always Last)
app.use(errorHandler);

export default app;