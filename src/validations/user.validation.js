import { z } from "zod";

export const updateProfileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters.")
      .max(100, "Name cannot exceed 100 characters.")
      .optional(),

    email: z
      .email("Invalid email address.")
      .optional(),

    salary: z
      .number()
      .min(0, "Salary cannot be negative.")
      .optional(),

    avatar_url: z
      .string()
      .url("Invalid avatar URL.")
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    {
      message: "At least one field is required.",
    }
  );