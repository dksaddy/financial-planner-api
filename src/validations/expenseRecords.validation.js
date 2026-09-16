import { z } from "zod";

import { EXPENSE_RECORD_MESSAGES } from "../constants/messages.js";
import {
  LIMIT_MAX,
  LIMIT_MIN,
  PAGE_MIN,
} from "../constants/limits.js";

const { VALIDATION } = EXPENSE_RECORD_MESSAGES;

export const createExpenseRecordSchema = z.object({
  expense_type_id: z.uuid(VALIDATION.EXPENSE_TYPE_ID_INVALID),

  date: z.string().date(VALIDATION.DATE_INVALID),
});

// Query strings are always strings, hence the coercion. `limit` is capped
// so a client cannot ask for the whole table in one request.
export const listExpenseRecordsQuerySchema = z.object({
  page: z.coerce
    .number(VALIDATION.PAGE_NUMBER)
    .int(VALIDATION.PAGE_INTEGER)
    .min(PAGE_MIN, VALIDATION.PAGE_MIN(PAGE_MIN))
    .default(1),

  limit: z.coerce
    .number(VALIDATION.LIMIT_NUMBER)
    .int(VALIDATION.LIMIT_INTEGER)
    .min(LIMIT_MIN, VALIDATION.LIMIT_MIN(LIMIT_MIN))
    .max(LIMIT_MAX, VALIDATION.LIMIT_MAX(LIMIT_MAX))
    .default(10),

  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, VALIDATION.MONTH_FORMAT)
    .optional(),
});
