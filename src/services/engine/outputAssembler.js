// @ts-check
/**
 * @fileoverview Assembles final vendor, timeline, risk, and idea outputs.
 */

import { CONSTANTS } from '../../config/constants.js';
import { buildTimeline, formatDate } from '../timelineService.js';
import { buildPlanBudget } from './allocationApplier.js';

/**
 * Builds vendor guidance list with priority flags and dates.
 *
 * @param {{ profile: object, eventDate: Date, today: Date, priorityFlags: string[], weeksToEvent: number }} params
 * @returns {object[]} Vendor guidance list
 */
function buildPlanVendors({ profile, eventDate, today, priorityFlags, weeksToEvent }) {
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

const DEFAULT_IDEAS = Object.freeze({
  themes: ['Contemporary Classic'],
  activities: ['Celebration Toast'],
  menu: ['Seasonal Platter'],
  decor: ['Atmospheric Lighting'],
  extras: ['Guest Welcome Card'],
});

/**
 * Builds timeline and vendors components for the final plan.
 * @param {object} profile
 * @param {object} context
 * @param {object} state
 * @param {object} req
 * @returns {{ timeline: object[], vendors: object[] }}
 */
function buildTimelineAndVendors(profile, context, state, req) {
  const timeline = buildTimeline(
    profile.timelineMilestones,
    req.eventDate,
    context.today,
    state.extraTasks,
  );
  const vendors = buildPlanVendors({
    profile,
    eventDate: context.eventDate,
    today: context.today,
    priorityFlags: state.priorityFlags,
    weeksToEvent: context.weeksToEvent,
  });
  return { timeline, vendors };
}

/**
 * Assembles final engine results from evaluated state.
 *
 * @param {{ profile: object, context: object, state: object, activeAllocation: Record<string, number>, validatedRequest: object }} params
 * @returns {object}
 */
export function assemblePlanOutputs({
  profile,
  context,
  state,
  activeAllocation,
  validatedRequest,
}) {
  const budget = buildPlanBudget({
    profile,
    totalBudget: validatedRequest.budget,
    baseAllocation: activeAllocation,
    shifts: state.accumulatedShifts,
    health: state.evaluatedHealth,
    perGuest: context.perGuest,
  });
  const { timeline, vendors } = buildTimelineAndVendors(profile, context, state, validatedRequest);
  const risks = selectTopRisks(state.risks);

  return {
    profile,
    context,
    budget,
    timeline,
    vendors,
    ideas: profile.templates?.ideas || DEFAULT_IDEAS,
    warnings: Array.from(new Set(state.warnings)),
    risks,
    firedRules: state.firedRules,
  };
}
