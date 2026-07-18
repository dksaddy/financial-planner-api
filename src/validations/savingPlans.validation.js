import { z } from "zod";

export const createSavingPlanSchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(100, "Name cannot exceed 100 characters"),

  amount: z.number().positive("Amount must be greater than 0"),

  frequency: z
    .number()
    .int()
    .positive("Frequency must be greater than 0"),

  months: z
    .number()
    .int()
    .positive("Months must be greater than 0"),

  depositAmount: z.number().min(0),

  depositFrequency: z
    .number()
    .int()
    .positive("Deposit frequency must be greater than 0"),

  withdrawalAmount: z.number().min(0),
});