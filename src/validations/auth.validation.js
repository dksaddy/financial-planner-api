import { z } from "zod";

import {
  email,
  existingPassword,
  name,
  newPassword,
} from "./fields.js";

export const registerSchema = z.object({
  name,
  email,
  password: newPassword,
});

export const loginSchema = z.object({
  email,
  password: existingPassword,
});
