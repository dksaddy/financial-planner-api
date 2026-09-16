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
});
