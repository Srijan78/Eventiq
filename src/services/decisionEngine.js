/**
 * @fileoverview Pure, deterministic decision engine implementing rule-based contextual planning.
 */

import { CONSTANTS } from '../config/constants.js';
import { getProfile } from '../profiles/index.js';
import { SHARED_RULES } from '../rules/sharedRules.js';
import { reconcile, computeHealth } from './budgetService.js';
import { buildTimeline, formatDate } from './timelineService.js';

/**
 * Builds the immutable planning context from the request and date.
 *
 * @param {object} req - Validated plan request
 * @param {Date} referenceDate - Current evaluation date
 * @param {object} profile - Resolved event profile
 * @returns {object} Calculated planning context
 */
function buildContext(req, referenceDate, profile) {
  const eventDate = new Date(req.eventDate);
  eventDate.setHours(0, 0, 0, 0);

  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  const diffMs = eventDate.getTime() - today.getTime();
  const daysToEvent = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const weeksToEvent = Math.max(0, Math.ceil(daysToEvent / CONSTANTS.TIMELINE.DAYS_PER_WEEK));
  const eventMonth = eventDate.getMonth() + 1;

  const perGuest = req.budget / req.guests;
  const costLevel = req.costLevel || CONSTANTS.COST_LEVELS.AVERAGE;
  const bands = profile.perGuestBands;

  return {
    request: req,
    eventDate,
    today,
    daysToEvent,
    weeksToEvent,
    eventMonth,
    perGuest,
    costLevel,
    bands,
    profile,
  };
}

/**
 * Resolves the baseline allocation, selecting child variants where applicable.
 *
 * @param {object} profile - Event profile
 * @param {object} req - Validated plan request
 * @returns {Record<string, number>} Baseline category percentages
 */
function getActiveAllocation(profile, req) {
  if (profile.id === 'birthday' && profile.childBudgetAllocation) {
    const age = req.birthday?.age;
    if (typeof age === 'number' && age <= CONSTANTS.BIRTHDAY.CHILD_AGE_MAX) {
      return { ...profile.childBudgetAllocation };
    }
  }
  return { ...profile.budgetAllocation };
}

/**
 * Executes a sequence of rule objects and updates accumulator state.
 *
 * @param {ReadonlyArray<object>} rules - Rule objects
 * @param {object} context - Planning context
 * @param {object} state - Mutable execution accumulator
 * @param {string} defaultPrefix - Description prefix fallback
 */
function executeRuleSet(rules, context, state, defaultPrefix) {
  for (const rule of rules) {
    if (!rule.applies(context)) {
      continue;
    }

    const output = rule.apply(context);
    const effectText =
      output.warnings && output.warnings.length > 0
        ? output.warnings.join(' ')
        : output.effect || `${defaultPrefix} ${rule.description}.`;

    state.firedRules.push({
      id: rule.id,
      description: rule.description,
      effect: effectText,
    });

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
}

/**
 * Reconciles category shifts and calculates exact Rupee amounts.
 *
 * @param {object} profile - Event profile
 * @param {number} totalBudget - Total budget amount
 * @param {Record<string, number>} baseAllocation - Base percentage map
 * @param {Record<string, number>} shifts - Accumulated percentage shifts
 * @param {object} health - Evaluated health structure
 * @param {number} perGuest - Raw spend per guest
 * @returns {object} Final budget object
 */
function buildPlanBudget(profile, totalBudget, baseAllocation, shifts, health, perGuest) {
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

/**
 * Builds vendor guidance list with priority flags and dates.
 *
 * @param {object} profile - Event profile
 * @param {Date} eventDate - Event date
 * @param {Date} today - Current reference date
 * @param {string[]} priorityFlags - Category IDs flagged for urgent booking
 * @param {number} weeksToEvent - Weeks remaining
 * @returns {object[]} Vendor guidance list
 */
function buildPlanVendors(profile, eventDate, today, priorityFlags, weeksToEvent) {
  return profile.vendorCategories.map((vc) => {
    const isPriority =
      priorityFlags.includes(vc.id) || weeksToEvent <= CONSTANTS.TIMELINE.URGENT_WEEKS;
    const bookByDateObj = new Date(eventDate);
    bookByDateObj.setDate(
      bookByDateObj.getDate() - Math.round(vc.bookWeeksBefore * CONSTANTS.TIMELINE.DAYS_PER_WEEK),
    );
    const bookByDate = bookByDateObj < today ? formatDate(today) : formatDate(bookByDateObj);

    return {
      categoryId: vc.id,
      label: vc.label,
      bookByDate,
      priority: isPriority ? 'immediate' : 'normal',
      checklist: [
        `Request written quotes from at least 2 qualified ${vc.label.toLowerCase()} providers.`,
        `Verify past client reviews and portfolio authenticity for ${vc.label.toLowerCase()}.`,
        `Clarify payment milestones (advance, midpoint, post-completion handover).`,
      ],
      questions: profile.templates?.vendorQuestions?.[vc.id] || [
        'What are your cancellation and reschedule terms?',
        'Is an on-site supervisor provided on event day?',
      ],
      redFlags: profile.templates?.vendorRedFlags?.[vc.id] || [
        'Refusing to sign a formal written scope of work.',
        'Demanding 100% upfront payment before delivery.',
      ],
    };
  });
}

/**
 * Filters and caps top 3 risks by severity.
 *
 * @param {object[]} risks - Fired risks
 * @returns {object[]} Top 3 risks
 */
function selectTopRisks(risks) {
  const sorted = [...risks].sort((a, b) => b.severity - a.severity).slice(0, 3);
  if (sorted.length === 0) {
    sorted.push({
      id: 'budget-overrun',
      title: 'Unbudgeted Overtime & Incidental Expenses',
      severity: CONSTANTS.SEVERITY.LOW,
      mitigation:
        'Keep the 5%+ contingency fund untouched until event day for sudden extra supplies.',
    });
  }
  return sorted;
}

/**
 * Runs the full deterministic decision engine pipeline.
 * Target: under 40 lines.
 *
 * @param {object} validatedRequest - Request validated by requestSchema
 * @param {Date} [referenceDate=new Date()] - Deterministic reference date for testing
 * @returns {object} Calculated plan blueprint including allocations, health, rules, timeline, vendors, risks
 */
export function runEngine(validatedRequest, referenceDate = new Date()) {
  const profile = getProfile(validatedRequest.eventType);
  const context = buildContext(validatedRequest, referenceDate, profile);
  const activeAllocation = getActiveAllocation(profile, validatedRequest);

  const state = {
    firedRules: [],
    accumulatedShifts: {},
    warnings: [],
    priorityFlags: [],
    extraTasks: [],
    risks: [],
    evaluatedHealth: null,
  };

  executeRuleSet(profile.rules, context, state, 'Applied');
  executeRuleSet(SHARED_RULES, context, state, 'Enforced');

  if (!state.evaluatedHealth) {
    state.evaluatedHealth = computeHealth(context.perGuest, context.costLevel, context.bands);
  }

  const budget = buildPlanBudget(
    profile,
    validatedRequest.budget,
    activeAllocation,
    state.accumulatedShifts,
    state.evaluatedHealth,
    context.perGuest,
  );
  const timeline = buildTimeline(
    profile.timelineMilestones,
    validatedRequest.eventDate,
    context.today,
    state.extraTasks,
  );
  const vendors = buildPlanVendors(
    profile,
    context.eventDate,
    context.today,
    state.priorityFlags,
    context.weeksToEvent,
  );
  const risks = selectTopRisks(state.risks);

  return {
    profile,
    context,
    budget,
    timeline,
    vendors,
    ideas: profile.templates?.ideas || {
      themes: ['Contemporary Classic'],
      activities: ['Celebration Toast'],
      menu: ['Seasonal Platter'],
      decor: ['Atmospheric Lighting'],
      extras: ['Guest Welcome Card'],
    },
    warnings: Array.from(new Set(state.warnings)),
    risks,
    firedRules: state.firedRules,
  };
}
