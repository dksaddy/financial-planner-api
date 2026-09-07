import { z } from "zod";

export const createTargetSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Target name must be at least 2 characters.")
    .max(100, "Target name cannot exceed 100 characters."),

  target_amount: z
    .coerce
    .number()
    .positive("Target amount must be greater than 0."),

  // Set when the user picks one of their existing target pictures
  // instead of uploading a new file.
  image_url: z
    .string()
    .trim()
    .url("Invalid image URL.")
    .optional()
    .or(z.literal("")),
});

export const updateTargetSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .optional(),

  target_amount: z
    .coerce
    .number()
    .positive()
    .optional(),

  status: z
    .enum(["pending", "completed"])
    .optional(),
});