/**
 * @fileoverview Zod schema for validating event plan creation requests.
 */

import { z } from 'zod';
import { CONSTANTS } from '../config/constants.js';

const todayMidnight = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const maxDateAhead = () => {
  const d = todayMidnight();
  d.setFullYear(d.getFullYear() + CONSTANTS.VALIDATION.DATE_MAX_YEARS_AHEAD);
  return d;
};

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const dateSchema = z
  .string()
  .trim()
  .regex(dateRegex, 'Date must be in YYYY-MM-DD format')
  .refine((val) => {
    const d = new Date(val);
    return !isNaN(d.getTime());
  }, 'Invalid calendar date')
  .refine((val) => {
    const d = new Date(val);
    d.setHours(0, 0, 0, 0);
    return d >= todayMidnight();
  }, 'Event date cannot be in the past')
  .refine((val) => {
    const d = new Date(val);
    d.setHours(0, 0, 0, 0);
    return d <= maxDateAhead();
  }, `Event date cannot be more than ${CONSTANTS.VALIDATION.DATE_MAX_YEARS_AHEAD} years in the future`);

const weddingDetailsSchema = z
  .object({
    functions: z.array(z.string().trim().max(40)).default([]),
    indoor: z.boolean().default(true),
    dietary: z.string().trim().max(200).default(''),
  })
  .default({ functions: [], indoor: true, dietary: '' });

const birthdayDetailsSchema = z
  .object({
    age: z.coerce.number().int().min(1).max(120).optional(),
    surprise: z.boolean().default(false),
    indoor: z.boolean().default(true),
  })
  .default({ surprise: false, indoor: true });

const communityDetailsSchema = z
  .object({
    expectedCrowd: z.coerce.number().int().min(1).max(50000).optional(),
    sponsorshipTarget: z.coerce
      .number()
      .int()
      .min(0)
      .max(CONSTANTS.VALIDATION.BUDGET_MAX)
      .default(0),
    indoor: z.boolean().default(false),
    isPublic: z.boolean().default(true),
  })
  .default({ sponsorshipTarget: 0, indoor: false, isPublic: true });

/**
 * Base schema for plan request.
 */
export const requestSchema = z
  .object({
    eventType: z.enum(['wedding', 'birthday', 'community', 'other'], {
      errorMap: () => ({ message: 'Event type must be wedding, birthday, community, or other' }),
    }),
    eventDate: dateSchema,
    guests: z.coerce
      .number({ invalid_type_error: 'Guest count must be a number' })
      .int('Guest count must be an integer')
      .min(
        CONSTANTS.VALIDATION.GUEST_MIN,
        `Guest count must be at least ${CONSTANTS.VALIDATION.GUEST_MIN}`,
      )
      .max(
        CONSTANTS.VALIDATION.GUEST_MAX,
        `Guest count cannot exceed ${CONSTANTS.VALIDATION.GUEST_MAX}`,
      ),
    budget: z.coerce
      .number({ invalid_type_error: 'Budget must be a number' })
      .int('Budget must be an integer')
      .min(
        CONSTANTS.VALIDATION.BUDGET_MIN,
        `Budget must be at least ₹${CONSTANTS.VALIDATION.BUDGET_MIN}`,
      )
      .max(
        CONSTANTS.VALIDATION.BUDGET_MAX,
        `Budget cannot exceed ₹${CONSTANTS.VALIDATION.BUDGET_MAX}`,
      ),
    city: z
      .string()
      .trim()
      .max(
        CONSTANTS.VALIDATION.CITY_MAX_LENGTH,
        `City name cannot exceed ${CONSTANTS.VALIDATION.CITY_MAX_LENGTH} characters`,
      )
      .default(''),
    costLevel: z.enum(['low', 'average', 'high']).default('average'),
    theme: z
      .string()
      .trim()
      .max(
        CONSTANTS.VALIDATION.THEME_MAX_LENGTH,
        `Theme cannot exceed ${CONSTANTS.VALIDATION.THEME_MAX_LENGTH} characters`,
      )
      .default(''),
    notes: z
      .string()
      .trim()
      .max(
        CONSTANTS.VALIDATION.NOTES_MAX_LENGTH,
        `Notes cannot exceed ${CONSTANTS.VALIDATION.NOTES_MAX_LENGTH} characters`,
      )
      .default(''),
    eventName: z
      .string()
      .trim()
      .max(
        CONSTANTS.VALIDATION.EVENT_NAME_MAX_LENGTH,
        `Event name cannot exceed ${CONSTANTS.VALIDATION.EVENT_NAME_MAX_LENGTH} characters`,
      )
      .optional()
      .default(''),
    wedding: weddingDetailsSchema,
    birthday: birthdayDetailsSchema,
    community: communityDetailsSchema,
  })
  .superRefine((data, ctx) => {
    if (data.eventType === 'other' && (!data.eventName || data.eventName.trim().length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['eventName'],
        message: 'Event name is required when event type is "other"',
      });
    }
  });

/**
 * Validates untrusted request data against requestSchema.
 * @param {unknown} data - Input payload
 * @returns {z.infer<typeof requestSchema>} Validated and normalized data
 */
export function validateRequest(data) {
  return requestSchema.parse(data);
}
