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


export const changePasswordSchema = z.object({
  oldPassword: z
    .string()
    .min(8, "Old password must be at least 8 characters"),

  newPassword: z
    .string()
    .min(8, "New password must be at least 8 characters"),

  confirmPassword: z
    .string()
    .min(8)
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  }
);

