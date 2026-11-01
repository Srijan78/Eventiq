// @ts-check
/**
 * @fileoverview Planning context and baseline allocation resolution.
 */

import { CONSTANTS } from '../../config/constants.js';

/**
 * Builds the immutable planning context from the request, reference date, and profile.
 *
 * @param {object} req - Validated plan request
 * @param {Date} referenceDate - Current evaluation date
 * @param {object} profile - Resolved event profile
 * @returns {object} Calculated planning context
 */
export function buildContext(req, referenceDate, profile) {
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
export function getActiveAllocation(profile, req) {
  if (profile.id === 'birthday' && profile.childBudgetAllocation) {
    const age = req.birthday?.age;
    if (typeof age === 'number' && age <= CONSTANTS.BIRTHDAY.CHILD_AGE_MAX) {
      return { ...profile.childBudgetAllocation };
    }
  }
  return { ...profile.budgetAllocation };
}
