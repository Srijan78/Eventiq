// @ts-check
/**
 * @fileoverview Applies accumulated category shifts and builds reconciled budget.
 */

import { CONSTANTS } from '../../config/constants.js';
import { reconcile } from '../budgetService.js';

/**
 * Reconciles category shifts and calculates exact Rupee amounts.
 *
 * @param {{ profile: object, totalBudget: number, baseAllocation: Record<string, number>, shifts: Record<string, number>, health: object, perGuest: number }} params
 * @returns {object} Final budget object
 */
export function buildPlanBudget({
  profile,
  totalBudget,
  baseAllocation,
  shifts,
  health,
  perGuest,
}) {
  const rawAdjusted = { ...baseAllocation };
  for (const [cat, shift] of Object.entries(shifts)) {
    if (rawAdjusted[cat] !== undefined) {
      rawAdjusted[cat] = Math.max(0, rawAdjusted[cat] + shift);
    }
  }

  rawAdjusted.contingency = Math.max(
    CONSTANTS.BUDGET.CONTINGENCY_FLOOR_PERCENT,
    rawAdjusted.contingency || CONSTANTS.BUDGET.CONTINGENCY_FLOOR_PERCENT,
  );

  const reconciled = reconcile(totalBudget, rawAdjusted);

  return {
    total: reconciled.total,
    perGuest: Math.round(perGuest),
    health,
    categories: reconciled.categories.map((c) => ({
      id: c.id,
      label: c.id.charAt(0).toUpperCase() + c.id.slice(1),
      percent: c.percent,
      amount: c.amount,
      rationale: profile.templates?.rationales?.[c.id] || `Allocation for ${c.id}.`,
      tips: profile.templates?.categoryTips?.[c.id] || [`Review and optimize ${c.id} options.`],
    })),
  };
}
