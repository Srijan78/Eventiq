/**
 * @fileoverview Zod schema for full Event Plan validation (both server and Gemini output).
 */

import { z } from 'zod';

const budgetCategorySchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  percent: z.number().min(0).max(100),
  amount: z.number().int().min(0),
  rationale: z.string().default(''),
  tips: z.array(z.string()).default([]),
});

const budgetSchema = z.object({
  total: z.number().int().positive(),
  perGuest: z.number().positive(),
  health: z.object({
    level: z.enum(['comfortable', 'tight', 'unrealistic']),
    reason: z.string().min(1),
  }),
  categories: z.array(budgetCategorySchema).min(1),
});

const taskItemSchema = z.object({
  title: z.string().min(1),
  detail: z.string().default(''),
});

const timelineMilestoneSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weeksLeft: z.number().int(),
  urgent: z.boolean().default(false),
  tasks: z.array(taskItemSchema).default([]),
});

const vendorCategorySchema = z.object({
  categoryId: z.string().min(1),
  label: z.string().min(1),
  bookByDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  priority: z.enum(['immediate', 'normal']).default('normal'),
  checklist: z.array(z.string()).default([]),
  questions: z.array(z.string()).default([]),
  redFlags: z.array(z.string()).default([]),
});

const ideasSchema = z.object({
  themes: z.array(z.string()).default([]),
  activities: z.array(z.string()).default([]),
  menu: z.array(z.string()).default([]),
  decor: z.array(z.string()).default([]),
  extras: z.array(z.string()).default([]),
});

const riskItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  severity: z.number().int().min(1).max(3),
  mitigation: z.string().min(1),
});

const firedRuleSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  effect: z.string().min(1),
});

export const planSchema = z.object({
  id: z.string().min(1),
  mode: z.enum(['ai', 'offline']),
  request: z.record(z.any()),
  summary: z.string().min(1),
  budget: budgetSchema,
  timeline: z.array(timelineMilestoneSchema).min(1),
  vendors: z.array(vendorCategorySchema).min(1),
  ideas: ideasSchema,
  warnings: z.array(z.string()).default([]),
  risks: z.array(riskItemSchema).default([]),
  firedRules: z.array(firedRuleSchema).default([]),
});

/**
 * Validates untrusted plan data.
 * @param {unknown} data - Plan object
 * @returns {z.infer<typeof planSchema>} Validated plan
 */
export function validatePlan(data) {
  return planSchema.parse(data);
}
