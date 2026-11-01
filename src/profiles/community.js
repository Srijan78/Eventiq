/**
 * @fileoverview Community gathering & festival profile specification for Eventiq.
 */

import { CONSTANTS } from '../config/constants.js';

export const communityProfile = Object.freeze({
  id: 'community',
  label: 'Community Event',

  budgetAllocation: Object.freeze({
    venue: 15,
    catering: 25,
    decor: 8,
    sound: 20,
    safety: 7,
    volunteers: 10,
    publicity: 5,
    contingency: 10,
  }),

  perGuestBands: Object.freeze({
    comfortable: 300,
    tight: 150,
  }),

  timelineMilestones: Object.freeze([
    {
      id: 'm-permits-venue',
      label: 'Venue Booking & Municipal / Police Permissions',
      weeksBefore: 8,
    },
    {
      id: 'm-sponsors-publicity',
      label: 'Sponsorship Pitch & Promotional Campaign Launch',
      weeksBefore: 6,
    },
    { id: 'm-stage-vendors', label: 'Finalize Sound, Stage, AV & Waste Vendors', weeksBefore: 4 },
    {
      id: 'm-volunteers-safety',
      label: 'Volunteer Headcount & First Aid Deployment Plan',
      weeksBefore: 2,
    },
    {
      id: 'm-runsheet-briefing',
      label: 'Onsite Safety Walkthrough & Volunteer Orientation',
      weeksBefore: 1,
    },
    { id: 'm-event-day', label: 'Event Execution, Crowd Control & Teardown', weeksBefore: 0 },
  ]),

  vendorCategories: Object.freeze([
    {
      id: 'venue',
      label: 'Public Ground / Community Hall',
      bookWeeksBefore: 8,
      priority: 'immediate',
      questionsHint:
        'Inquire about parking permits, green room access, and municipal waste clearance protocol.',
    },
    {
      id: 'sound',
      label: 'Stage, Truss, Lighting & Sound (PA System)',
      bookWeeksBefore: 4,
      priority: 'immediate',
      questionsHint:
        'Verify generator wattage, decibel compliance with local noise laws, and rain protection tarps.',
    },
    {
      id: 'catering',
      label: 'Community Refreshments & Water Stations',
      bookWeeksBefore: 4,
      priority: 'normal',
      questionsHint:
        'Plan bulk hydration dispensers and hygienic eco-friendly distribution points.',
    },
    {
      id: 'safety',
      label: 'First Aid, Security Guard & Fire Compliance',
      bookWeeksBefore: 3,
      priority: 'immediate',
      questionsHint:
        'Verify trained paramedic presence, functional fire extinguishers, and crowd barrier setups.',
    },
    {
      id: 'volunteers',
      label: 'Volunteer Coordination & Uniform Badges',
      bookWeeksBefore: 2,
      priority: 'normal',
      questionsHint:
        'Coordinate volunteer orientation schedule, walkie-talkie sets, and meal box logistics.',
    },
    {
      id: 'decor',
      label: 'Banners, Signage & Stage Backdrop',
      bookWeeksBefore: 2,
      priority: 'normal',
      questionsHint:
        'Ensure durable weatherproof directional signage and prominent emergency exit signboards.',
    },
    {
      id: 'publicity',
      label: 'Flyers, Digital Posters & Community Outreach',
      bookWeeksBefore: 6,
      priority: 'normal',
      questionsHint:
        'Focus on local neighborhood WhatsApp networks, civic bulletin boards, and notice boards.',
    },
  ]),

  rules: Object.freeze([
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
  ]),

  promptContext:
    'A high-participation community gathering prioritizing civic order, crowd safety, volunteer coordination, cost stewardship, and inclusive social spirit.',

  templates: Object.freeze({
    summary:
      'A disciplined, community-centric event blueprint ensuring safety, engaging activities, and robust volunteer leadership.',
    rationales: Object.freeze({
      venue: 'Accessible public space or hall with adequate transit, restrooms, and parking.',
      catering:
        'Simple, inclusive refreshments and widespread hydration points for community comfort.',
      decor: 'Functional signage, welcoming banners, and clear stage branding.',
      sound:
        'Professional sound reinforcement ensuring all announcements and performances reach the crowd cleanly.',
      safety:
        'Paramedic readiness, first aid station, certified security guards, and emergency crowd management.',
      volunteers:
        'The core operational engine: badges, snacks, orientation materials, and communication radios.',
      publicity:
        'Grassroots community outreach, printed flyers, and localized social announcements.',
      contingency:
        'Buffer for unforeseen municipal fees, extension permits, or extra clean-up charges.',
    }),
    categoryTips: Object.freeze({
      venue: [
        'Inspect restroom facilities and ensure water supply is steady.',
        'Ensure wheelchair accessibility ramps are clear.',
      ],
      catering: [
        'Opt for eco-friendly paper cups or bring-your-own-bottle water refill stations.',
        'Distribute packaged light snacks that create minimal trash.',
      ],
      decor: [
        'Hang weather-resistant vinyl banners high above head height.',
        'Place large high-contrast directional arrow signboards.',
      ],
      sound: [
        'Conduct sound check 2 hours prior to start.',
        'Have 2 backup wired microphones in case of wireless RF interference.',
      ],
      safety: [
        'Keep a fully stocked commercial first aid kit at the registration table.',
        'Locate 2 dry-chemical fire extinguishers near stage electrics.',
      ],
      volunteers: [
        'Conduct a mandatory 15-minute morning briefing before gates open.',
        'Provide vibrant identifiable high-visibility badges.',
      ],
      publicity: [
        'Distribute flyers in nearby community centres and residential lobbies.',
        'Post event schedules on local neighborhood groups.',
      ],
      contingency: [
        'Retain reserve funds for day-of trash removal labor.',
        'Do not disburse final vendor payments before site clearance.',
      ],
    }),
    vendorQuestions: Object.freeze({
      venue: [
        'What are the noise level curfews and electricity load limitations?',
        'Who handles municipal sanitation after the event?',
      ],
      sound: [
        'Do you supply an on-site audio sound technician throughout the event?',
        'Is a backup diesel generator included for the AV setup?',
      ],
      catering: [
        'Can you provide sealed water dispensers with continuous refilling?',
        'Are snacks packaged for rapid queue movement?',
      ],
      safety: [
        'Are your security personnel trained in crowd evacuation and basic first aid?',
        'Do you provide perimeter control stanchions?',
      ],
      volunteers: [
        'Can badges and orientation packets be printed 48 hours prior?',
        'Are walkie-talkies compatible with venue frequencies?',
      ],
      decor: [
        'Are banners printed on durable outdoor weatherproof material?',
        'Can directional stands withstand windy conditions?',
      ],
      publicity: [
        'What is the turnaround time for printing 500 promotional flyers?',
        'Can digital social assets be delivered in multiple aspect ratios?',
      ],
    }),
    vendorRedFlags: Object.freeze({
      venue: [
        'No clear point of contact on event morning.',
        'Locked emergency exits during operational hours.',
      ],
      sound: [
        'Faulty grounding wires causing hum or electrical shock hazard.',
        'Unwillingness to comply with permissible decibel limits.',
      ],
      catering: [
        'Uncovered open food standing in direct sun.',
        'Shortage of drinking water for attendees.',
      ],
      safety: [
        'Security staff leaving designated exit posts unattended.',
        'Expired fire safety canisters.',
      ],
      volunteers: [
        'Failure to conduct check-in briefing resulting in uncoordinated chaos.',
        'Lack of emergency escalation contact tree.',
      ],
      decor: [
        'Banners poorly anchored, blowing down into walkways.',
        'Obstructing mandatory venue safety signage.',
      ],
      publicity: [
        'Inaccurate dates or venue addresses on distributed print materials.',
        'Unauthorized fly-posting on private walls.',
      ],
    }),
    ideas: Object.freeze({
      themes: [
        'Neighborhood Green Earth Fair',
        'Heritage Cultural Mela & Artisan Bazaar',
        'Community Wellness & Sports Day',
      ],
      activities: [
        'Citizen Open Mic & Folk Arts Stage',
        'Interactive Tree-Planting Drive',
        'Youth Skill Exhibition & Robotics Showcase',
      ],
      menu: [
        'Community Chai & Healthy Millet Snacks',
        'Fresh Coconut Water & Citrus Coolers',
        'Locally Baked Buns & Vegetarian Cutlets',
      ],
      decor: [
        'Eco-Friendly Jute Bunting Flags',
        'Chalk Art Chalkboards for Community Messages',
        'Potted Plant Stage Podium Greenery',
      ],
      extras: [
        'Community Swap-A-Book Table',
        'Civic Feedback & Suggestion Drop Box',
        'Free Blood Pressure & Wellness Checkup Tent',
      ],
    }),
  }),
});
