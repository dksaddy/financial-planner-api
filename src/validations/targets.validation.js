import { z } from "zod";

import { TARGET_MESSAGES } from "../constants/messages.js";
import { TARGET_STATUSES } from "../constants/status.js";
import { name } from "./fields.js";

const { VALIDATION } = TARGET_MESSAGES;

export const createTargetSchema = z.object({
  name,

  target_amount: z
    .coerce
    .number()
    .positive(VALIDATION.AMOUNT_POSITIVE),
});

export const updateTargetSchema = z.object({
  name: name.optional(),

  target_amount: z
    .coerce
    .number()
    .positive(VALIDATION.AMOUNT_POSITIVE)
    .optional(),

  status: z
    .enum(TARGET_STATUSES)
    .optional(),

  // Drops the picture. A multipart body carries it as the string "true", a
  // JSON body as a boolean, so both are accepted.
  remove_image: z
    .preprocess(
      (value) =>
        value === "true" ? true : value === "false" ? false : value,
      z.boolean({ error: VALIDATION.REMOVE_IMAGE_BOOLEAN })
    )
    .optional(),
});
