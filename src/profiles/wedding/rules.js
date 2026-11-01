// @ts-check
/**
 * @fileoverview Wedding contextual decision rules.
 */

import { CONSTANTS } from '../../config/constants.js';

export const rules = Object.freeze([
  {
    id: 'W-FUNCTIONS',
    description: 'Multiple wedding ceremonies selected',
    applies: (ctx) => {
      const functions = ctx.request.wedding?.functions || [];
      return functions.length > 1;
    },
    apply: (ctx) => {
      const count = ctx.request.wedding.functions.length;
      return {
        allocationShifts: { logistics: 2, decor: -2 },
        warnings: [
          `Managing ${count} ceremonies (${ctx.request.wedding.functions.join(', ')}): Ensure vendor schedules do not conflict between rituals.`,
        ],
        extraTasks: [
          {
            milestoneId: 'm-logistics-runsheet',
            title: 'Create per-ceremony runsheet',
            detail: `Coordinate separate timeline schedules for: ${ctx.request.wedding.functions.join(', ')}.`,
          },
        ],
      };
    },
  },
  {
    id: 'W-PEAK-SEASON',
    description: 'Peak wedding season booking pressure (Oct - Feb)',
    applies: (ctx) => {
      return CONSTANTS.SEASONS.WEDDING_PEAK_MONTHS.includes(ctx.eventMonth);
    },
    apply: () => ({
      warnings: [
        'Event falls in peak wedding season: Venue and premier photographer dates book up fast. Secure contracts with lock-in advance immediately.',
      ],
      priorityFlags: ['venue', 'photography', 'catering'],
      risks: [
        {
          id: 'peak-season-premium',
          title: 'Peak Season Availability & Surcharges',
          severity: 2,
          mitigation:
            'Book top-tier vendors at least 5-6 months in advance or negotiate weekday ceremony slots.',
        },
      ],
    }),
  },
  {
    id: 'W-DIETARY',
    description: 'Custom dietary and regional culinary preferences',
    applies: (ctx) => {
      return Boolean(ctx.request.wedding?.dietary && ctx.request.wedding.dietary.trim().length > 0);
    },
    apply: (ctx) => ({
      warnings: [
        `Special dietary requirement noted: "${ctx.request.wedding.dietary}". Ensure strict catering kitchen segregation.`,
      ],
      extraTasks: [
        {
          milestoneId: 'm-tastings-fittings',
          title: 'Schedule customized dietary menu tasting',
          detail: `Audit caterer protocols for: ${ctx.request.wedding.dietary}.`,
        },
      ],
    }),
  },
  {
    id: 'W-SHORT-NOTICE',
    description: 'Short planning runway (< 60 days to wedding)',
    applies: (ctx) => ctx.weeksToEvent < 9,
    apply: () => ({
      allocationShifts: { contingency: 2, decor: -2 },
      warnings: [
        'Wedding is less than 60 days away: Expedited booking required for venue, photographer, and catering.',
      ],
      priorityFlags: ['venue', 'catering', 'photography', 'makeup'],
      risks: [
        {
          id: 'vendor-scarcity',
          title: 'Short-Notice Vendor Scarcity',
          severity: 3,
          mitigation:
            'Prioritize bundled venue-and-catering packages to minimize multiple vendor negotiations.',
        },
      ],
    }),
  },
]);
