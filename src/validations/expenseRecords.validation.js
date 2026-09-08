import { z } from "zod";

export const createExpenseRecordSchema = z.object({
  expense_type_id: z.uuid("Invalid expense type id"),

  date: z.string().date("Invalid date"),
});

// Query strings are always strings, hence the coercion. `limit` is capped
// so a client cannot ask for the whole table in one request.
export const listExpenseRecordsQuerySchema = z.object({
  page: z.coerce
    .number("Page must be a number")
    .int("Page must be a whole number")
    .min(1, "Page must be at least 1")
    .default(1),

  limit: z.coerce
    .number("Limit must be a number")
    .int("Limit must be a whole number")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .default(10),

  month: z
    .string()
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Month must be in YYYY-MM format")
    .optional(),
});
