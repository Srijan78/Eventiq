/**
 * @fileoverview Shared rules evaluated across every event profile in fixed sequence.
 */

import { CONSTANTS } from '../config/constants.js';
import { computeHealth } from '../services/budgetService.js';

/**
 * Shared rules evaluated across every event profile in fixed sequence.
 * @type {ReadonlyArray<object>}
 */
export const SHARED_RULES = Object.freeze([
  {
    id: 'S-HEALTH',
    description: 'Budget feasibility and tier balancing',
    applies: () => true,
    apply: (ctx) => {
      const health = computeHealth(ctx.perGuest, ctx.costLevel, ctx.bands);
      const shifts = {};
      const warnings = [];

      if (health.level === 'tight') {
        shifts.catering = 4;
        shifts.decor = -4;
        warnings.push('Tight budget detected: Reallocated +4% to protect catering and food quality while trimming decor.');
      } else if (health.level === 'unrealistic') {
        const multiplier = CONSTANTS.COST_MULTIPLIERS[ctx.costLevel] || 1.0;
        const minViableBudget = Math.round(ctx.bands.tight * multiplier * ctx.request.guests);
        warnings.push(
          `Unrealistic budget warning: Minimum viable spend for ${ctx.request.guests} guests at "${ctx.costLevel}" cost level is approximately ₹${minViableBudget.toLocaleString('en-IN')}. Consider reducing guest list or trimming non-essential categories.`,
        );
      }

      return {
        allocationShifts: shifts,
        warnings,
        budgetHealth: health,
      };
    },
  },
  {
    id: 'S-CONTINGENCY',
    description: 'Mandatory contingency reserve floor',
    applies: () => true,
    apply: () => ({
      warnings: [],
    }),
  },
  {
    id: 'S-URGENT',
    description: 'Urgent planning runway (< 4 weeks to event date)',
    applies: (ctx) => ctx.weeksToEvent <= CONSTANTS.TIMELINE.URGENT_WEEKS && ctx.weeksToEvent > CONSTANTS.TIMELINE.VERY_URGENT_WEEKS,
    apply: () => ({
      warnings: [
        'Urgent event timeline (< 4 weeks away): Compressed scheduling active. Immediate vendor locking is vital.',
      ],
      priorityFlags: ['venue', 'catering', 'photography', 'sound'],
      risks: [
        {
          id: 'lead-time-scarcity',
          title: 'Limited Vendor Availability',
          severity: 2,
          mitigation: 'Book ready-to-go packages rather than custom negotiations.',
        },
      ],
    }),
  },
  {
    id: 'S-VERY-URGENT',
    description: 'Last-minute emergency timeline (≤ 1 week to event date)',
    applies: (ctx) => ctx.weeksToEvent <= CONSTANTS.TIMELINE.VERY_URGENT_WEEKS,
    apply: () => ({
      warnings: [
        'Critical timeline: Event is within 7 days! Switched to last-minute operational checklist.',
      ],
      priorityFlags: ['venue', 'catering', 'sound', 'safety'],
      risks: [
        {
          id: 'immediate-turnaround',
          title: 'Extreme Time Crunch',
          severity: 3,
          mitigation: 'Focus strictly on venue access, essential catering, and immediate attendees. Omit multi-round approvals.',
        },
      ],
    }),
  },
  {
    id: 'S-LARGE',
    description: 'Large crowd management and traffic logistics (> 400 attendees)',
    applies: (ctx) => ctx.request.guests > CONSTANTS.CROWD_THRESHOLDS.LARGE_GUESTS,
    apply: () => ({
      warnings: [
        'Large gathering (> 400 guests): Prioritize dedicated parking, multi-queue buffet counters, and clear directional signs.',
      ],
      extraTasks: [
        {
          milestoneId: 'm-venue-date',
          title: 'Verify venue parking & egress capacity for 400+ attendees',
          detail: 'Ensure at least 1 parking slot per 4 guests or arrange valet parking lot.',
        },
      ],
      risks: [
        {
          id: 'crowd-traffic',
          title: 'Arrival Congestion & Long Lines',
          severity: 2,
          mitigation: 'Set up at least 3 distinct food/refreshment stations and multiple registration counters.',
        },
      ],
    }),
  },
  {
    id: 'S-SMALL',
    description: 'Intimate gathering (< 30 attendees)',
    applies: (ctx) => ctx.request.guests < CONSTANTS.CROWD_THRESHOLDS.SMALL_GUESTS,
    apply: () => ({
      allocationShifts: { venue: -5, catering: 5 },
      warnings: [
        'Intimate gathering (< 30 guests): Shifted 5% from venue to food and elevated hospitality.',
      ],
    }),
  },
  {
    id: 'S-OUTDOOR-SEASON',
    description: 'Outdoor venue during active monsoon season (June - September)',
    applies: (ctx) => {
      const isOutdoor =
        ctx.request.wedding?.indoor === false ||
        ctx.request.birthday?.indoor === false ||
        ctx.request.community?.indoor === false;
      return isOutdoor && CONSTANTS.SEASONS.MONSOON_MONTHS.includes(ctx.eventMonth);
    },
    apply: () => ({
      warnings: [
        'Monsoon weather alert (Outdoor event between June and September): Waterproof canopy coverage and raised flooring are critical.',
      ],
      extraTasks: [
        {
          milestoneId: 'm-attire-decor',
          title: 'Reserve weather-proof marquee / waterproof canopy backup',
          detail: 'Ensure covered walkways between dining area, restrooms, and main stage.',
        },
      ],
      risks: [
        {
          id: 'monsoon-disruption',
          title: 'Rain & Electrical Hazards',
          severity: 3,
          mitigation: 'Contract waterproof outdoor canopy with elevated wooden platforms and waterproof electrical cabling.',
        },
      ],
    }),
  },
]);
