import { z } from "zod";

import { USER_MESSAGES } from "../constants/messages.js";
import {
  WORKING_DAYS_PER_MONTH_MAX,
  WORKING_DAYS_PER_MONTH_MIN,
  WORKING_DAYS_PER_WEEK_MAX,
  WORKING_DAYS_PER_WEEK_MIN,
} from "../constants/limits.js";
import {
  email,
  existingPassword,
  name,
  newPassword,
} from "./fields.js";

const { VALIDATION } = USER_MESSAGES;

export const updateProfileSchema = z
  .object({
    name: name.optional(),

    email: email.optional(),

    salary: z
      .number()
      .min(0, VALIDATION.SALARY_NEGATIVE)
      .optional(),

    working_days_per_month: z
      .number()
      .int(VALIDATION.WORKING_DAYS_PER_MONTH_INTEGER)
      .min(
        WORKING_DAYS_PER_MONTH_MIN,
        VALIDATION.WORKING_DAYS_PER_MONTH_RANGE(
          WORKING_DAYS_PER_MONTH_MIN,
          WORKING_DAYS_PER_MONTH_MAX
        )
      )
      .max(
        WORKING_DAYS_PER_MONTH_MAX,
        VALIDATION.WORKING_DAYS_PER_MONTH_RANGE(
          WORKING_DAYS_PER_MONTH_MIN,
          WORKING_DAYS_PER_MONTH_MAX
        )
      )
      .optional(),

    working_days_per_week: z
      .number()
      .int(VALIDATION.WORKING_DAYS_PER_WEEK_INTEGER)
      .min(
        WORKING_DAYS_PER_WEEK_MIN,
        VALIDATION.WORKING_DAYS_PER_WEEK_RANGE(
          WORKING_DAYS_PER_WEEK_MIN,
          WORKING_DAYS_PER_WEEK_MAX
        )
      )
      .max(
        WORKING_DAYS_PER_WEEK_MAX,
        VALIDATION.WORKING_DAYS_PER_WEEK_RANGE(
          WORKING_DAYS_PER_WEEK_MIN,
          WORKING_DAYS_PER_WEEK_MAX
        )
      )
      .optional(),

    avatar_url: z
      .string()
      .url(VALIDATION.AVATAR_URL_INVALID)
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: VALIDATION.NOTHING_TO_UPDATE,
  });

// Only a bare file name — the service prefixes the user's folder itself, so a
// name that could climb out of it is refused here before it reaches storage.
export const selectAvatarSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, VALIDATION.PHOTO_REQUIRED)
    .refine(
      (value) =>
        !value.includes("/") &&
        !value.includes("\\") &&
        !value.includes(".."),
      { message: USER_MESSAGES.AVATAR_INVALID }
    ),
});

// The old password is re-typed, so presence only; the service's bcrypt check
// is the verdict. The confirmation only has to match the new one.
export const changePasswordSchema = z
  .object({
    oldPassword: existingPassword,

    newPassword,

    confirmPassword: z
      .string()
      .min(1, VALIDATION.CONFIRM_PASSWORD_REQUIRED),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: VALIDATION.PASSWORDS_DIFFER,
    path: ["confirmPassword"],
  });
