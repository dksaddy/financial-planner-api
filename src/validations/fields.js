import { z } from "zod";

import { COMMON_MESSAGES } from "../constants/messages.js";
import {
  NAME_MAX,
  NAME_MIN,
  PASSWORD_MIN,
} from "../constants/limits.js";

const { VALIDATION } = COMMON_MESSAGES;

// Fields more than one resource accepts. Each is defined once here so a name,
// an email or a password is held to the same rule and answers with the same
// message wherever it is submitted.

export const name = z
  .string()
  .trim()
  .min(NAME_MIN, VALIDATION.NAME_MIN(NAME_MIN))
  .max(NAME_MAX, VALIDATION.NAME_MAX(NAME_MAX));

// Normalized before it is checked, so `Test@Example.com ` cannot register or be
// saved as a second spelling of an existing address.
export const email = z
  .string()
  .trim()
  .toLowerCase()
  .email(VALIDATION.EMAIL_INVALID);

// A password being chosen: register, and the new one on a password change.
export const newPassword = z
  .string()
  .min(PASSWORD_MIN, VALIDATION.PASSWORD_MIN(PASSWORD_MIN));

// An existing password being re-typed: login, the old one on a password
// change, and every saving-plan confirmation.
//
// Only presence is checked, never length or shape. Applying the register rules
// here would reject a valid older password and would tell an attacker the
// policy before they ever guess. The real verdict is bcrypt's.
export const existingPassword = z
  .string()
  .min(1, VALIDATION.PASSWORD_REQUIRED);
