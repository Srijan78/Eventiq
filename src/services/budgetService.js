// @ts-check
/**
 * @fileoverview Pure budget calculation, allocation reconciliation, and health assessment.
 */

import { CONSTANTS } from '../config/constants.js';

/**
 * Normalizes allocation percentages to sum to exactly 100.
 *
 * @param {Array<[string, number]>} entries
 * @returns {Record<string, number>}
 */
function normalizePercentages(entries) {
  const rawSum = entries.reduce((acc, [, pct]) => acc + pct, 0);
  const normalizedPcts = {};
  for (const [id, pct] of entries) {
    normalizedPcts[id] = rawSum > 0 ? (pct / rawSum) * 100 : 100 / entries.length;
  }
  return normalizedPcts;
}

/**
 * Enforces mandatory contingency percentage floor across categories.
 *
 * @param {Record<string, number>} normalizedPcts
 */
function ensureContingencyFloor(normalizedPcts) {
  const floor = CONSTANTS.BUDGET.CONTINGENCY_FLOOR_PERCENT;
  if (!normalizedPcts.contingency || normalizedPcts.contingency < floor) {
    const deficit = floor - (normalizedPcts.contingency || 0);
    normalizedPcts.contingency = floor;

    const others = Object.keys(normalizedPcts).filter(
      (k) => k !== 'contingency' && normalizedPcts[k] > 0,
    );
    const otherSum = others.reduce((acc, k) => acc + normalizedPcts[k], 0);
    if (otherSum > 0) {
      for (const k of others) {
        normalizedPcts[k] = Math.max(
          0,
          normalizedPcts[k] - (deficit * normalizedPcts[k]) / otherSum,
        );
      }
    }
  }
}

/**
 * Calculates Rupee integer amounts and distributes remainder to contingency.
 *
 * @param {Record<string, number>} normalizedPcts
 * @param {number} totalBudget
 * @returns {Array<{ id: string, percent: number, amount: number }>}
 */
function calculateCategoryAmounts(normalizedPcts, totalBudget) {
  let runningSum = 0;
  const categories = [];

  for (const [id, pct] of Object.entries(normalizedPcts)) {
    const amount = Math.floor((totalBudget * pct) / 100);
    runningSum += amount;
    categories.push({
      id,
      percent: Math.round(pct * 10) / 10,
      amount,
    });
  }

  const remainder = totalBudget - runningSum;
  const targetCategory = categories.find((c) => c.id === 'contingency') || categories[0];
  if (targetCategory) {
    targetCategory.amount += remainder;
  }

  return categories;
}

/**
 * Reconciles budget percentages to exact rupee integer amounts.
 * Guarantees the invariant: sum(categoryAmounts) === totalBudget.
 * Any rounding remainder is allocated to the contingency reserve.
 *
 * @param {number} totalBudget - Total event budget in INR (positive integer)
 * @param {Record<string, number>} allocationPcts - Percentage allocations per category (must sum to ~100)
 * @returns {{ categories: Array<{ id: string, percent: number, amount: number }>, total: number }}
 */
export function reconcile(totalBudget, allocationPcts) {
  if (typeof totalBudget !== 'number' || totalBudget <= 0) {
    throw new Error('Total budget must be a positive number');
  }

  const entries = Object.entries(allocationPcts);
  if (entries.length === 0) {
    throw new Error('Allocation percentages cannot be empty');
  }

  const normalizedPcts = normalizePercentages(entries);
  ensureContingencyFloor(normalizedPcts);
  const categories = calculateCategoryAmounts(normalizedPcts, totalBudget);

  const finalSum = categories.reduce((acc, c) => acc + c.amount, 0);
  if (finalSum !== totalBudget) {
    throw new Error(`Budget reconciliation invariant failed: sum ${finalSum} !== ${totalBudget}`);
  }

  return {
    categories,
    total: totalBudget,
  };
}

/**
 * Evaluates budget health tier based on effective per-guest spend and regional cost level.
 *
 * @param {number} perGuest - Unadjusted spend per guest (budget / guests)
 * @param {string} costLevel - Regional cost level ('low', 'average', 'high')
 * @param {{ comfortable: number, tight: number }} bands - Threshold bands for profile
 * @returns {{ level: 'comfortable' | 'tight' | 'unrealistic', reason: string, effectivePerGuest: number }}
 */
export function computeHealth(perGuest, costLevel, bands) {
  const multiplier = CONSTANTS.COST_MULTIPLIERS[costLevel] || 1.0;
  const effectivePerGuest = perGuest / multiplier;
  const roundedEffective = Math.round(effectivePerGuest);

  if (effectivePerGuest >= bands.comfortable) {
    return {
      level: 'comfortable',
      reason: `Comfortable budget: Effective ₹${roundedEffective.toLocaleString('en-IN')}/guest exceeds the ₹${bands.comfortable.toLocaleString('en-IN')} benchmark for this event type.`,
      effectivePerGuest,
    };
  }

  if (effectivePerGuest >= bands.tight) {
    return {
      level: 'tight',
      reason: `Tight budget: Effective ₹${roundedEffective.toLocaleString('en-IN')}/guest meets basic requirements (benchmark: ₹${bands.tight.toLocaleString('en-IN')} - ₹${bands.comfortable.toLocaleString('en-IN')}). Priority placed on core essentials.`,
      effectivePerGuest,
    };
  }

  return {
    level: 'unrealistic',
    reason: `Unrealistic budget: Effective ₹${roundedEffective.toLocaleString('en-IN')}/guest is below the ₹${bands.tight.toLocaleString('en-IN')} minimum viable benchmark. Strongly advise scaling down guest count or increasing budget.`,
    effectivePerGuest,
  };
}
