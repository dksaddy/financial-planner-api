import { z } from "zod";

import { SAVING_PLAN_MESSAGES } from "../constants/messages.js";
import { SAVING_PLAN_STATUSES } from "../constants/status.js";
import { TAX_RATE_MAX, TAX_RATE_MIN } from "../constants/limits.js";
import { existingPassword, name } from "./fields.js";

const { VALIDATION } = SAVING_PLAN_MESSAGES;

// Every saving-plan mutation is confirmed with the account password, so each
// schema below carries it — checked for presence only, the verdict is
// `assertPassword`'s.
const password = existingPassword;

export const createSavingPlanSchema = z.object({
  name,

  amount: z.number().positive(VALIDATION.AMOUNT_POSITIVE),

  frequency: z
    .number()
    .int(VALIDATION.FREQUENCY_INTEGER)
    .positive(VALIDATION.FREQUENCY_POSITIVE),

  months: z
    .number()
    .int(VALIDATION.MONTHS_INTEGER)
    .positive(VALIDATION.MONTHS_POSITIVE),

  depositAmount: z
    .number()
    .min(0, VALIDATION.DEPOSIT_TARGET_NEGATIVE),

  depositFrequency: z
    .number()
    .int(VALIDATION.DEPOSIT_FREQUENCY_INTEGER)
    .positive(VALIDATION.DEPOSIT_FREQUENCY_POSITIVE),

  withdrawalAmount: z
    .number()
    .min(0, VALIDATION.WITHDRAWAL_AMOUNT_NEGATIVE),

  // A percent. Optional so a client that predates it still works: a new plan
  // takes DEFAULT_TAX_RATE, and an update keeps the stored rate.
  taxRate: z
    .number()
    .min(TAX_RATE_MIN, VALIDATION.TAX_RATE_RANGE(TAX_RATE_MIN, TAX_RATE_MAX))
    .max(TAX_RATE_MAX, VALIDATION.TAX_RATE_RANGE(TAX_RATE_MIN, TAX_RATE_MAX))
    .optional(),

  password,
});

export const depositSavingPlanSchema = z.object({
  amount: z.number().positive(VALIDATION.DEPOSIT_AMOUNT_POSITIVE),

  password,
});

// DELETE carries a body for the confirmation, which is why it now validates
// at all. Clients must send it as a JSON body (axios: `delete(url, { data })`).
export const deleteSavingPlanSchema = z.object({
  password,
});

// Which moves between the statuses are legal is a service rule, not a schema one.
export const updateSavingPlanStatusSchema = z.object({
  status: z.enum(SAVING_PLAN_STATUSES, {
    error: VALIDATION.STATUS_INVALID,
  }),

  password,
});
