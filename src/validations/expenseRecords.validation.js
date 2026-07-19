import { z } from "zod";

export const createExpenseRecordSchema = z.object({
  expense_type_id: z.uuid("Invalid expense type id"),

  date: z.string().date("Invalid date"),
});