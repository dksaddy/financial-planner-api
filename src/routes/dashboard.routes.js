import { Router } from "express";
import authenticate from "../middlewares/auth.middleware.js";
import { getDashboard } from "../controllers/dashboard.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", getDashboard);

export default router;