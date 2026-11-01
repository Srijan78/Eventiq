// @ts-check
/**
 * @fileoverview Evaluates contextual rule sets and accumulates planning artifacts.
 */

/**
 * Creates a fresh execution state accumulator.
 * @returns {object}
 */
export function createExecutionState() {
  return {
    firedRules: [],
    accumulatedShifts: {},
    warnings: [],
    priorityFlags: [],
    extraTasks: [],
    risks: [],
    evaluatedHealth: null,
  };
}

/**
 * Merges allocation shifts, warnings, tasks, and risks into accumulator state.
 *
 * @param {object} state
 * @param {object} output
 */
function accumulateRuleArtifacts(state, output) {
  if (output.allocationShifts) {
    for (const [cat, shift] of Object.entries(output.allocationShifts)) {
      state.accumulatedShifts[cat] = (state.accumulatedShifts[cat] || 0) + shift;
    }
  }
  if (output.warnings) {
    state.warnings.push(...output.warnings);
  }
  if (output.priorityFlags) {
    state.priorityFlags.push(...output.priorityFlags);
  }
  if (output.extraTasks) {
    state.extraTasks.push(...output.extraTasks);
  }
  if (output.risks) {
    state.risks.push(...output.risks);
  }
  if (output.budgetHealth) {
    state.evaluatedHealth = output.budgetHealth;
  }
}

/**
 * Applies single rule output into the execution state accumulator.
 *
 * @param {object} state
 * @param {object} output
 * @param {object} rule
 * @param {string} defaultPrefix
 */
function applyRuleOutput(state, output, rule, defaultPrefix) {
  const effectText =
    output.warnings && output.warnings.length > 0
      ? output.warnings.join(' ')
      : output.effect || `${defaultPrefix} ${rule.description}.`;

  state.firedRules.push({
    id: rule.id,
    description: rule.description,
    effect: effectText,
  });

  accumulateRuleArtifacts(state, output);
}

/**
 * Executes a sequence of rule objects and updates accumulator state.
 *
 * @param {ReadonlyArray<object>} rules - Rule objects
 * @param {object} context - Planning context
 * @param {object} state - Mutable execution accumulator
 * @param {string} defaultPrefix - Description prefix fallback
 */
export function executeRuleSet(rules, context, state, defaultPrefix) {
  for (const rule of rules) {
    if (rule.applies(context)) {
      const output = rule.apply(context);
      applyRuleOutput(state, output, rule, defaultPrefix);
    }
  }
}
