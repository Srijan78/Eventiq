/**
 * @fileoverview Pure, deterministic decision engine implementing rule-based contextual planning.
 */

import { CONSTANTS } from '../config/constants.js';
import { getProfile } from '../profiles/index.js';
import { reconcile, computeHealth } from './budgetService.js';
import { buildTimeline, formatDate } from './timelineService.js';

/**
 * Shared rules evaluated across every event profile in fixed sequence.
 * @type {ReadonlyArray<object>}
 */
const SHARED_RULES = Object.freeze([
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
      // Enforced during allocation reconciliation in budgetService
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

/**
 * Runs the full deterministic decision engine pipeline.
 *
 * @param {object} validatedRequest - Request validated by requestSchema
 * @param {Date} [referenceDate=new Date()] - Deterministic reference date for testing
 * @returns {object} Calculated plan blueprint including allocations, health, rules, timeline, vendors, risks
 */
export function runEngine(validatedRequest, referenceDate = new Date()) {
  const profile = getProfile(validatedRequest.eventType);

  // Time calculations
  const eventDate = new Date(validatedRequest.eventDate);
  eventDate.setHours(0, 0, 0, 0);

  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  const diffMs = eventDate.getTime() - today.getTime();
  const daysToEvent = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  const weeksToEvent = Math.max(0, Math.ceil(daysToEvent / CONSTANTS.TIMELINE.DAYS_PER_WEEK));
  const eventMonth = eventDate.getMonth() + 1; // 1 - 12

  const perGuest = validatedRequest.budget / validatedRequest.guests;
  const costLevel = validatedRequest.costLevel || CONSTANTS.COST_LEVELS.AVERAGE;
  const bands = profile.perGuestBands;

  const context = {
    request: validatedRequest,
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

  // Check if birthday child variant applies
  let activeBudgetAllocation = { ...profile.budgetAllocation };
  if (profile.id === 'birthday' && profile.childBudgetAllocation) {
    const age = validatedRequest.birthday?.age;
    if (typeof age === 'number' && age <= CONSTANTS.BIRTHDAY.CHILD_AGE_MAX) {
      activeBudgetAllocation = { ...profile.childBudgetAllocation };
    }
  }

  const firedRules = [];
  const accumulatedShifts = {};
  const warnings = [];
  const priorityFlags = [];
  const extraTasks = [];
  const risks = [];
  let evaluatedHealth = null;

  // 1. Run profile rules
  for (const rule of profile.rules) {
    if (rule.applies(context)) {
      const output = rule.apply(context);
      const effectText =
        output.warnings && output.warnings.length > 0
          ? output.warnings.join(' ')
          : output.effect || `Applied ${rule.description}.`;

      firedRules.push({
        id: rule.id,
        description: rule.description,
        effect: effectText,
      });

      if (output.allocationShifts) {
        for (const [cat, shift] of Object.entries(output.allocationShifts)) {
          accumulatedShifts[cat] = (accumulatedShifts[cat] || 0) + shift;
        }
      }
      if (output.warnings) {
        warnings.push(...output.warnings);
      }
      if (output.priorityFlags) {
        priorityFlags.push(...output.priorityFlags);
      }
      if (output.extraTasks) {
        extraTasks.push(...output.extraTasks);
      }
      if (output.risks) {
        risks.push(...output.risks);
      }
    }
  }

  // 2. Run shared rules
  for (const rule of SHARED_RULES) {
    if (rule.applies(context)) {
      const output = rule.apply(context);
      const effectText =
        output.warnings && output.warnings.length > 0
          ? output.warnings.join(' ')
          : output.effect || `Enforced ${rule.description}.`;

      firedRules.push({
        id: rule.id,
        description: rule.description,
        effect: effectText,
      });

      if (output.allocationShifts) {
        for (const [cat, shift] of Object.entries(output.allocationShifts)) {
          accumulatedShifts[cat] = (accumulatedShifts[cat] || 0) + shift;
        }
      }
      if (output.warnings) {
        warnings.push(...output.warnings);
      }
      if (output.priorityFlags) {
        priorityFlags.push(...output.priorityFlags);
      }
      if (output.extraTasks) {
        extraTasks.push(...output.extraTasks);
      }
      if (output.risks) {
        risks.push(...output.risks);
      }
      if (output.budgetHealth) {
        evaluatedHealth = output.budgetHealth;
      }
    }
  }

  // Fallback health evaluation if not set by S-HEALTH
  if (!evaluatedHealth) {
    evaluatedHealth = computeHealth(perGuest, costLevel, bands);
  }

  // 3. Apply allocation shifts and enforce bounds
  const rawAdjusted = { ...activeBudgetAllocation };
  for (const [cat, shift] of Object.entries(accumulatedShifts)) {
    if (rawAdjusted[cat] !== undefined) {
      rawAdjusted[cat] = Math.max(0, rawAdjusted[cat] + shift);
    }
  }

  // Enforce contingency floor
  rawAdjusted.contingency = Math.max(
    CONSTANTS.BUDGET.CONTINGENCY_FLOOR_PERCENT,
    rawAdjusted.contingency || CONSTANTS.BUDGET.CONTINGENCY_FLOOR_PERCENT,
  );

  // 4. Reconcile budget to exact Rupee figures
  const reconciledBudget = reconcile(validatedRequest.budget, rawAdjusted);

  // 5. Build timeline with extra tasks
  const timeline = buildTimeline(profile.timelineMilestones, validatedRequest.eventDate, today, extraTasks);

  // 6. Build vendor category guidance
  const vendors = profile.vendorCategories.map((vc) => {
    const isPriority = priorityFlags.includes(vc.id) || weeksToEvent <= CONSTANTS.TIMELINE.URGENT_WEEKS;
    const bookByDateObj = new Date(eventDate);
    bookByDateObj.setDate(bookByDateObj.getDate() - Math.round(vc.bookWeeksBefore * CONSTANTS.TIMELINE.DAYS_PER_WEEK));
    // If book by date is in past, clamp to today
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
        `What are your cancellation and reschedule terms?`,
        `Is an on-site supervisor provided on event day?`,
      ],
      redFlags: profile.templates?.vendorRedFlags?.[vc.id] || [
        `Refusing to sign a formal written scope of work.`,
        `Demanding 100% upfront payment before delivery.`,
      ],
    };
  });

  // 7. Select top 3 risks by severity (ties broken by insertion order)
  const sortedRisks = [...risks]
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 3);

  // Add default risk if none triggered
  if (sortedRisks.length === 0) {
    sortedRisks.push({
      id: 'budget-overrun',
      title: 'Unbudgeted Overtime & Incidental Expenses',
      severity: 1,
      mitigation: 'Keep the 5%+ contingency fund untouched until event day for sudden extra supplies.',
    });
  }

  return {
    profile,
    context,
    budget: {
      total: reconciledBudget.total,
      perGuest: Math.round(perGuest),
      health: evaluatedHealth,
      categories: reconciledBudget.categories.map((c) => ({
        id: c.id,
        label: profile.templates?.rationales?.[c.id]
          ? c.id.charAt(0).toUpperCase() + c.id.slice(1)
          : c.id.charAt(0).toUpperCase() + c.id.slice(1),
        percent: c.percent,
        amount: c.amount,
        rationale: profile.templates?.rationales?.[c.id] || `Allocation for ${c.id}.`,
        tips: profile.templates?.categoryTips?.[c.id] || [`Review and optimize ${c.id} options.`],
      })),
    },
    timeline,
    vendors,
    ideas: profile.templates?.ideas || {
      themes: ['Contemporary Classic'],
      activities: ['Celebration Toast'],
      menu: ['Seasonal Platter'],
      decor: ['Atmospheric Lighting'],
      extras: ['Guest Welcome Card'],
    },
    warnings: Array.from(new Set(warnings)),
    risks: sortedRisks,
    firedRules,
  };
}
