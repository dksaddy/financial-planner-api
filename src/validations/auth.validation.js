import { z } from "zod";

import {
  email,
  existingPassword,
  name,
  newPassword,
  timeZone,
} from "./fields.js";

export const registerSchema = z.object({
  name,
  email,
  password: newPassword,

  // Sent by the web from the browser, so a new account starts in the right
  // zone. Optional: without it the account is UTC until the profile says
  // otherwise.
  time_zone: timeZone.optional(),
});

export const loginSchema = z.object({
  email,
  password: existingPassword,
});
