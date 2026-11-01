// @ts-check
/**
 * @fileoverview Community gathering contextual decision rules.
 */

import { CONSTANTS } from '../../config/constants.js';

export const rules = Object.freeze([
  {
    id: 'C-PERMISSIONS',
    description: 'Statutory permissions and local authority intimation',
    applies: () => true,
    apply: () => ({
      warnings: [
        'Mandatory compliance: Obtain written venue approval, loud speaker permits (if using amplification), and notify the local police station.',
      ],
      extraTasks: [
        {
          milestoneId: 'm-permits-venue',
          title: 'File sound decibel permit & police intimation letter',
          detail:
            'Submit formal intimation to the local jurisdiction precinct with proposed run-of-show.',
        },
      ],
    }),
  },
  {
    id: 'C-NOC',
    description: 'Large crowd or public assembly statutory clearance',
    applies: (ctx) => {
      const crowd = ctx.request.community?.expectedCrowd || ctx.request.guests;
      const isPublic = ctx.request.community?.isPublic ?? true;
      return crowd > CONSTANTS.CROWD_THRESHOLDS.COMMUNITY_NOC_CROWD || isPublic;
    },
    apply: (ctx) => {
      const crowd = ctx.request.community?.expectedCrowd || ctx.request.guests;
      return {
        allocationShifts: { safety: 2, decor: -2 },
        warnings: [
          `Public gathering / Large crowd scale (${crowd} expected): Police NOC, certified fire extinguisher deployment, and ambulance standby are strongly recommended.`,
        ],
        risks: [
          {
            id: 'crowd-congestion',
            title: 'Crowd Surges & Egress Bottlenecks',
            severity: 3,
            mitigation:
              'Implement dual separated entry/exit gates and maintain wide 10-foot perimeter clearance aisles.',
          },
        ],
        extraTasks: [
          {
            milestoneId: 'm-permits-venue',
            title: 'Secure formal Fire Safety & Traffic Clearance NOC',
            detail:
              'Provide venue layout blueprint indicating unobstructed emergency exits and fire hydrants.',
          },
        ],
      };
    },
  },
  {
    id: 'C-SAFETY-TIER',
    description: 'Crowd safety infrastructure scaling',
    applies: () => true,
    apply: (ctx) => {
      const crowd = ctx.request.community?.expectedCrowd || ctx.request.guests;
      let tierNote = 'Tier 1 (<100 attendees): Basic first-aid kit and designated safety lead.';
      if (crowd >= 100 && crowd <= 500) {
        tierNote =
          'Tier 2 (100-500 attendees): Certified first-aid station, 4 security guards, and labeled emergency exits.';
      } else if (crowd > 500) {
        tierNote =
          'Tier 3 (500+ attendees): Paramedic on standby, dedicated triage zone, barricaded sound console, and 8+ security guards.';
      }
      return {
        warnings: [tierNote],
        extraTasks: [
          {
            milestoneId: 'm-volunteers-safety',
            title: 'Establish Emergency Response & Lost Child Station',
            detail:
              'Designate a clearly marked, illuminated information kiosk with dedicated radio operator.',
          },
        ],
      };
    },
  },
  {
    id: 'C-SPONSOR',
    description: 'Sponsorship target and funding gap tracking',
    applies: (ctx) => {
      return Boolean(
        ctx.request.community?.sponsorshipTarget && ctx.request.community.sponsorshipTarget > 0,
      );
    },
    apply: (ctx) => {
      const target = ctx.request.community.sponsorshipTarget;
      const budget = ctx.request.budget;
      const netFunding = budget - target;
      const note =
        netFunding >= 0
          ? `Sponsorship target: ₹${target.toLocaleString('en-IN')}. Target covers ${(
              (target / budget) *
              100
            ).toFixed(
              0,
            )}% of total budget (Net organizer funding: ₹${netFunding.toLocaleString('en-IN')}).`
          : `Sponsorship target exceeds total budget! Target: ₹${target.toLocaleString('en-IN')}, Budget: ₹${budget.toLocaleString('en-IN')}.`;

      return {
        warnings: [note],
        extraTasks: [
          {
            milestoneId: 'm-sponsors-publicity',
            title: 'Prepare Sponsor Deliverables & Brand Placement Grid',
            detail:
              'Confirm banner positioning, emcee verbal acknowledgements, and booth footprint sizes.',
          },
        ],
      };
    },
  },
  {
    id: 'C-VOLUNTEERS',
    description: 'Volunteer workforce organization',
    applies: () => true,
    apply: (ctx) => {
      const crowd = ctx.request.community?.expectedCrowd || ctx.request.guests;
      const volunteersNeeded = Math.max(4, Math.ceil(crowd / 30));
      return {
        warnings: [
          `Volunteer force target: Recruit approximately ${volunteersNeeded} volunteers across registration, ushering, water distribution, and stage support.`,
        ],
        extraTasks: [
          {
            milestoneId: 'm-volunteers-safety',
            title: 'Draft Volunteer Duty Roster & Role Cards',
            detail: `Assign lead coordinators for ${volunteersNeeded} volunteers with rotation shifts.`,
          },
        ],
      };
    },
  },
]);
