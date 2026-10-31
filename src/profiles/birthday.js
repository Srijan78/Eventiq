/**
 * @fileoverview Birthday profile specification for Eventiq (with child and adult variants).
 */

import { CONSTANTS } from '../config/constants.js';

export const birthdayProfile = Object.freeze({
  id: 'birthday',
  label: 'Birthday Party',

  budgetAllocation: Object.freeze({
    venue: 25,
    catering: 35,
    decor: 10,
    photography: 3,
    entertainment: 12,
    cake: 6,
    gifts: 3,
    contingency: 6,
  }),

  childBudgetAllocation: Object.freeze({
    venue: 15,
    catering: 30,
    decor: 12,
    photography: 3,
    entertainment: 18,
    cake: 7,
    gifts: 8,
    contingency: 7,
  }),

  perGuestBands: Object.freeze({
    comfortable: 800,
    tight: 400,
  }),

  timelineMilestones: Object.freeze([
    { id: 'm-theme-venue', label: 'Choose Theme & Book Venue / Plan Home Space', weeksBefore: 6 },
    { id: 'm-invites-vendors', label: 'Send Invitations & Book Entertainer / Host', weeksBefore: 4 },
    { id: 'm-cake-catering', label: 'Order Custom Cake & Finalize Menu', weeksBefore: 2 },
    { id: 'm-favors-decor', label: 'Purchase Decor, Return Gifts & Party Props', weeksBefore: 1 },
    { id: 'm-final-headcount', label: 'Confirm RSVPs & Prepare Playlist / Games', weeksBefore: 0.5 },
    { id: 'm-party-day', label: 'Party Execution & Celebration', weeksBefore: 0 },
  ]),

  vendorCategories: Object.freeze([
    {
      id: 'venue',
      label: 'Party Venue / Play Area',
      bookWeeksBefore: 6,
      priority: 'normal',
      questionsHint: 'Check setup access time, outside food permission, and cleanup policy.',
    },
    {
      id: 'catering',
      label: 'Party Catering & Finger Foods',
      bookWeeksBefore: 3,
      priority: 'normal',
      questionsHint: 'Inquire about kid-friendly bite portions, beverage stations, and heating equipment.',
    },
    {
      id: 'cake',
      label: 'Bespoke Bakery & Cake Designer',
      bookWeeksBefore: 2,
      priority: 'normal',
      questionsHint: 'Confirm delivery timing to the venue, structural support for multi-tier, and allergen options.',
    },
    {
      id: 'entertainment',
      label: 'Party Host, Games & Magic / DJ',
      bookWeeksBefore: 4,
      priority: 'normal',
      questionsHint: 'Verify age-appropriate interactive activities, equipment setup, and session duration.',
    },
    {
      id: 'decor',
      label: 'Balloon & Theme Styling',
      bookWeeksBefore: 2,
      priority: 'normal',
      questionsHint: 'Ask about balloon arch durability, backdrop dimensions, and teardown service.',
    },
    {
      id: 'gifts',
      label: 'Party Favors & Return Gifts',
      bookWeeksBefore: 2,
      priority: 'normal',
      questionsHint: 'Ensure age-suitable curation and keep extra gift units for unexpected siblings.',
    },
    {
      id: 'photography',
      label: 'Event Photography',
      bookWeeksBefore: 3,
      priority: 'normal',
      questionsHint: 'Ask about candid cake-cutting coverage and turnaround time for edited pictures.',
    },
  ]),

  rules: Object.freeze([
    {
      id: 'B-CHILD',
      description: 'Children party dynamics (Age under 13)',
      applies: (ctx) => {
        const age = ctx.request.birthday?.age;
        return typeof age === 'number' && age <= CONSTANTS.BIRTHDAY.CHILD_AGE_MAX;
      },
      apply: (ctx) => {
        const guestCount = ctx.request.guests || 20;
        const supervisorsNeeded = Math.max(1, Math.ceil(guestCount / CONSTANTS.BIRTHDAY.CHILD_SUPERVISOR_RATIO));
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
  ]),

  promptContext:
    'A joyous and personal birthday celebration highlighting social warmth, fun games, personalized cake centerpiece, and stress-free hospitality.',

  templates: Object.freeze({
    summary: 'A vibrant, fun-filled birthday party plan focused on delightful experiences and memorable moments.',
    rationales: Object.freeze({
      venue: 'Provides the setting, energetic space for activities, and guest comfort.',
      catering: 'Delicious, easy-to-eat party foods and beverages tailored to guest tastes.',
      decor: 'Transforms the room with celebratory balloon installations, banners, and theme props.',
      photography: 'Captures spontaneous laughter, reactions, and the signature cake cutting moment.',
      entertainment: 'Engaging host, interactive music, or games to keep all guests energized.',
      cake: 'The culinary and visual centerpiece of the birthday celebration.',
      gifts: 'Thoughtful token gifts expressing gratitude to guests for celebrating together.',
      contingency: 'Safety buffer for unexpected guest siblings, extra snacks, or extended venue time.',
    }),
    categoryTips: Object.freeze({
      venue: ['Ensure adequate open space for games and group dancing.', 'Confirm trash cans and cleanup bags are provided.'],
      catering: ['Serve bite-sized items that can be eaten standing without heavy cutlery.', 'Provide continuous hydration and mocktail options.'],
      decor: ['Invest in a striking photo-worthy backdrop around the cake table.', 'Avoid helium balloons near ceiling fans.'],
      photography: ['Photograph decor and cake table before guests arrive.', 'Ensure group photos are taken before the party winds down.'],
      entertainment: ['Schedule structured games during the first hour while energy is high.', 'Prepare backup background playlists on phone.'],
      cake: ['Have candles, lighter, and cake knife ready at the table 15 minutes prior.', 'Store cake in a cool room away from direct sunlight.'],
      gifts: ['Pre-pack return gifts with name tags for easy distribution at exit.', 'Keep 3-4 extra favor bags on standby.'],
      contingency: ['Keep a small roll of duct tape and scissors in your party kit.', 'Have emergency phone charging banks accessible.'],
    }),
    vendorQuestions: Object.freeze({
      venue: ['Can we arrive 1 hour early for balloon and banner decoration?', 'Are outside sound systems allowed?'],
      catering: ['Are chafing dishes and warmers provided with the service?', 'Can menu items be labeled for dietary clarity?'],
      cake: ['Is direct venue delivery handled by your temperature-controlled vehicle?', 'Do you provide allergen-free cupcake alternatives?'],
      entertainment: ['What age group is your interactive magic/game repertoire best suited for?', 'Do you bring your own wireless speaker and mic?'],
      decor: ['How long does installation take, and do you include teardown?', 'Are balloon materials biodegradable?'],
      gifts: ['Can return gifts be themed to match our party character or color scheme?', 'Is gift wrapping included?'],
      photography: ['Can you provide high-resolution digital files within 7 business days?', 'Do you offer a quick teaser preview?'],
    }),
    vendorRedFlags: Object.freeze({
      venue: ['Demanding hidden cleaning fees not mentioned in original booking.', 'Insufficient electrical outlets for audio equipment.'],
      catering: ['Lukewarm food delivery without heating trays.', 'Uncovered food displays vulnerable to dust.'],
      cake: ['Unstable structural dowels causing tilting during transport.', 'Late delivery missing the cake cutting schedule.'],
      entertainment: ['Inappropriate jokes or unengaging monotone game hosting.', 'Failure to engage shy children or guests.'],
      decor: ['Low-grade balloons popping spontaneously before the event begins.', 'Damage to venue walls using non-removable adhesives.'],
      gifts: ['Broken or hazardous cheap plastic toys for small children.', 'Mismatched favor packaging.'],
      photography: ['Missing the crucial cake blow-out moment due to distraction.', 'Excessive delays delivering digital photos.'],
    }),
    ideas: Object.freeze({
      themes: ['Retro Arcade & Neon Glow', 'Whimsical Enchanted Forest', 'Vintage Hollywood Red Carpet Celebration'],
      activities: ['Custom Trivia About the Birthday Star', 'Live DIY Cupcake Decorating Station', 'Music Video Flash Challenge'],
      menu: ['Gourmet Sliders & Handcrafted Fries', 'Bite-Sized Quesadillas & Fresh Guacamole', 'Artisanal Churros with Warm Chocolate Dip'],
      decor: ['Personalized Photo Memory Chandelier', 'Organic Balloon Garland with Foliage Accents', 'Custom Neon Name Sign Backdrop'],
      extras: ['Signature Non-Alcoholic Mocktail Wall', 'Instant Polaroid Scrapbook Guestbook', 'Customized Playlist Curated by Friends'],
    }),
  }),
});
