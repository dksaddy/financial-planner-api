import { z } from "zod";

import { EXPENSE_TYPE_MESSAGES } from "../constants/messages.js";
import { name } from "./fields.js";

const { VALIDATION } = EXPENSE_TYPE_MESSAGES;

const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, VALIDATION.CATEGORY_NAME_REQUIRED),

  // Strictly a number here — the web mirror coerces, because form inputs yield
  // strings. `positive`, not `nonnegative`: a category worth 0 contributes
  // nothing to the type's total and only ever arrived from a blank field.
  amount: z
    .number()
    .positive(VALIDATION.CATEGORY_AMOUNT_POSITIVE),
});

export const createExpenseTypeSchema = z.object({
  name,

  categories: z
    .array(categorySchema)
    .min(1, VALIDATION.CATEGORIES_REQUIRED),
});

// Same shape as create — the total is not a field, it is derived from
// the categories and must come out equal to the stored total.
export const updateExpenseTypeSchema = createExpenseTypeSchema;

export const updateExpenseTypeStatusSchema = z.object({
  is_active: z.boolean({
    error: VALIDATION.IS_ACTIVE_BOOLEAN,
  }),
});
