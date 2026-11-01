// @ts-check
/**
 * @fileoverview Birthday contextual decision rules.
 */

import { CONSTANTS } from '../../config/constants.js';

export const rules = Object.freeze([
  {
    id: 'B-CHILD',
    description: 'Children party dynamics (Age under 13)',
    applies: (ctx) => {
      const age = ctx.request.birthday?.age;
      return typeof age === 'number' && age <= CONSTANTS.BIRTHDAY.CHILD_AGE_MAX;
    },
    apply: (ctx) => {
      const guestCount = ctx.request.guests || 20;
      const supervisorsNeeded = Math.max(
        1,
        Math.ceil(guestCount / CONSTANTS.BIRTHDAY.CHILD_SUPERVISOR_RATIO),
      );
      return {
        useVariant: 'child',
        warnings: [
          `Children's party protocol: Plan dedicated supervision (recommended minimum: ${supervisorsNeeded} adult supervisors for ${guestCount} children).`,
          'Keep run-of-show compact (2 to 2.5 hours) to prevent over-tiredness and meltdowns.',
        ],
        extraTasks: [
          {
            milestoneId: 'm-favors-decor',
            title: 'Collect allergy declarations from parents',
            detail: 'Confirm nut/dairy allergies before cake cutting and snack distribution.',
          },
          {
            milestoneId: 'm-party-day',
            title: 'Assign designated adult chaperone supervision posts',
            detail: `Ensure ${supervisorsNeeded} adults monitor activity and exit zones.`,
          },
        ],
      };
    },
  },
  {
    id: 'B-TEEN',
    description: 'Teenager celebration dynamics (Age 13 to 19)',
    applies: (ctx) => {
      const age = ctx.request.birthday?.age;
      return (
        typeof age === 'number' &&
        age >= CONSTANTS.BIRTHDAY.TEEN_AGE_MIN &&
        age <= CONSTANTS.BIRTHDAY.TEEN_AGE_MAX
      );
    },
    apply: () => ({
      allocationShifts: { entertainment: 3, catering: 2, decor: -5 },
      warnings: [
        'Teen birthday: Emphasize high-energy entertainment (DJ, gaming, photo booth) and flexible finger food over formal decor.',
      ],
      extraTasks: [
        {
          milestoneId: 'm-final-headcount',
          title: 'Confirm party curfew and parent pickup logistics',
          detail: 'Set a clear finish time and establish designated pickup coordinates.',
        },
      ],
    }),
  },
  {
    id: 'B-MILESTONE',
    description: 'Milestone milestone year (18, 21, 30, 40, 50, 60+)',
    applies: (ctx) => {
      const age = ctx.request.birthday?.age;
      return typeof age === 'number' && CONSTANTS.BIRTHDAY.MILESTONE_AGES.includes(age);
    },
    apply: (ctx) => ({
      warnings: [
        `Special Milestone Celebration (${ctx.request.birthday.age}th): Consider spotlight tributes and heirloom memory displays.`,
      ],
      extraTasks: [
        {
          milestoneId: 'm-invites-vendors',
          title: 'Collect photo submissions for anniversary tribute slideshow',
          detail: 'Gather childhood and milestone photographs from close friends and family.',
        },
      ],
    }),
  },
  {
    id: 'B-HOME-VS-HALL',
    description: 'Small gathering suited for intimate home setup (≤ 25 guests)',
    applies: (ctx) => ctx.request.guests <= 25,
    apply: () => ({
      allocationShifts: { venue: -10, catering: 6, entertainment: 4 },
      warnings: [
        'Intimate guest count (≤ 25 guests): Host at home or private terrace to eliminate heavy commercial venue fees and boost catering quality.',
      ],
    }),
  },
  {
    id: 'B-SURPRISE',
    description: 'Surprise party coordination protocols',
    applies: (ctx) => Boolean(ctx.request.birthday?.surprise),
    apply: () => ({
      warnings: [
        'Surprise party active: Advise all attendees to arrive 30-45 minutes prior to the guest of honor.',
      ],
      extraTasks: [
        {
          milestoneId: 'm-invites-vendors',
          title: 'Create secret coordination channel (excluding guest of honor)',
          detail: 'Share decoy plan, parking camouflage instructions, and arrival windows.',
        },
        {
          milestoneId: 'm-party-day',
          title: 'Coordinate decoy arrival and cue for lights & fanfare',
          detail: 'Assign one person to accompany the guest of honor and text the ETA.',
        },
      ],
      risks: [
        {
          id: 'surprise-spoil',
          title: 'Surprise Element Compromise',
          severity: 1,
          mitigation: 'Establish a trusted single-point-of-contact for RSVP communications.',
        },
      ],
    }),
  },
]);
