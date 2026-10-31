/**
 * @fileoverview Zod schemas for the plan refine flow and Gemini-constrained patches.
 */

import { z } from 'zod';
import { CONSTANTS } from '../config/constants.js';

export const refineRequestSchema = z.object({
  planId: z.string().trim().optional(),
  plan: z.record(z.any()).optional(),
  instruction: z
    .string()
    .trim()
    .min(1, 'Refine instruction cannot be empty')
    .max(
      CONSTANTS.VALIDATION.REFINE_INSTRUCTION_MAX_LENGTH,
      `Instruction cannot exceed ${CONSTANTS.VALIDATION.REFINE_INSTRUCTION_MAX_LENGTH} characters`,
    ),
});

export const refinePatchSchema = z.object({
  budget: z
    .number()
    .int()
    .min(CONSTANTS.VALIDATION.BUDGET_MIN)
    .max(CONSTANTS.VALIDATION.BUDGET_MAX)
    .optional(),
  guests: z
    .number()
    .int()
    .min(CONSTANTS.VALIDATION.GUEST_MIN)
    .max(CONSTANTS.VALIDATION.GUEST_MAX)
    .optional(),
  addFunctions: z.array(z.string().trim().max(40)).optional(),
  removeCategories: z.array(z.string().trim()).optional(),
  ideaFocus: z.string().trim().max(100).optional(),
  tone: z.string().trim().max(50).optional(),
});

/**
 * Validates a refine request.
 * @param {unknown} data - Untrusted input
 * @returns {z.infer<typeof refineRequestSchema>}
 */
export function validateRefineRequest(data) {
  return refineRequestSchema.parse(data);
}
