import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes.js";
import notFound from "./middlewares/notFound.middleware.js";
import errorHandler from "./middlewares/error.middleware.js";
import { env } from "./config/env.js";

import savingPlansRoutes from "./routes/savingPlans.routes.js";
import expenseTypesRoutes from "./routes/expenseTypes.routes.js";
import expenseRecordRoutes from "./routes/expenseRecords.routes.js";
import userRoutes from "./routes/user.routes.js";
import targetRoutes from "./routes/targets.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

const app = express();

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

      return callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Financial Planner API",
  });
});

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