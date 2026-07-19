import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/auth.routes.js";
import notFound from "./middlewares/notFound.middleware.js";
import errorHandler from "./middlewares/error.middleware.js";

import savingPlansRoutes from "./routes/savingPlans.routes.js";
import expenseTypesRoutes from "./routes/expenseTypes.routes.js";


const app = express();

app.use(cors());
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


// Always last
// 404 Middleware
app.use(notFound);

// Error Middleware (Always Last)
app.use(errorHandler);

export default app;