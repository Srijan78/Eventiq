// @ts-check
/**
 * @fileoverview Pure, deterministic decision engine implementing rule-based contextual planning.
 */

import { getProfile } from '../profiles/index.js';
import { SHARED_RULES } from '../rules/sharedRules.js';
import { computeHealth } from './budgetService.js';
import { buildContext, getActiveAllocation } from './engine/contextBuilder.js';
import { createExecutionState, executeRuleSet } from './engine/ruleRunner.js';
import { assemblePlanOutputs } from './engine/outputAssembler.js';

/**
 * Runs the full deterministic decision engine pipeline.
 *
 * @param {object} validatedRequest - Request validated by requestSchema
 * @param {Date} [referenceDate=new Date()] - Deterministic reference date for testing
 * @returns {object} Calculated plan blueprint including allocations, health, rules, timeline, vendors, risks
 */
export function runEngine(validatedRequest, referenceDate = new Date()) {
  const profile = getProfile(validatedRequest.eventType);
  const context = buildContext(validatedRequest, referenceDate, profile);
  const activeAllocation = getActiveAllocation(profile, validatedRequest);
  const state = createExecutionState();

  executeRuleSet(profile.rules, context, state, 'Applied');
  executeRuleSet(SHARED_RULES, context, state, 'Enforced');

  if (!state.evaluatedHealth) {
    state.evaluatedHealth = computeHealth(context.perGuest, context.costLevel, context.bands);
  }

  return assemblePlanOutputs({ profile, context, state, activeAllocation, validatedRequest });
}
