import { Router } from "express";
import { register } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { registerSchema } from "../validations/auth.validation.js";

const router = Router();

router.post("/register", validate(registerSchema), register);

export default router;