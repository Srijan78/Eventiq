/**
 * @fileoverview Wedding profile specification for Eventiq.
 */

import { CONSTANTS } from '../config/constants.js';

export const weddingProfile = Object.freeze({
  id: 'wedding',
  label: 'Wedding',

  budgetAllocation: Object.freeze({
    venue: 20,
    catering: 30,
    decor: 12,
    photography: 8,
    attire: 10,
    entertainment: 5,
    makeup: 3,
    logistics: 4,
    contingency: 8,
  }),

  perGuestBands: Object.freeze({
    comfortable: 3000,
    tight: 1500,
  }),

  timelineMilestones: Object.freeze([
    { id: 'm-venue-date', label: 'Lock Date & Venue', weeksBefore: 24 },
    { id: 'm-photo-caterer', label: 'Book Photographer & Caterer', weeksBefore: 16 },
    { id: 'm-attire-decor', label: 'Finalize Decor & Wedding Attire', weeksBefore: 12 },
    { id: 'm-invites-makeup', label: 'Send Invitations & Book Makeup Artist', weeksBefore: 8 },
    { id: 'm-tastings-fittings', label: 'Menu Tastings & Attire Fittings', weeksBefore: 4 },
    {
      id: 'm-logistics-runsheet',
      label: 'Logistics, Rehearsal & Vendor Confirmation',
      weeksBefore: 2,
    },
    { id: 'm-final-prep', label: 'Final Headcount & Emergency Kit', weeksBefore: 1 },
    { id: 'm-day-of', label: 'Wedding Day Coordination', weeksBefore: 0 },
  ]),

  vendorCategories: Object.freeze([
    {
      id: 'venue',
      label: 'Wedding Venue & Banquet',
      bookWeeksBefore: 24,
      priority: 'immediate',
      questionsHint: 'Inquire about curfew hours, backup generator, and outside catering policy.',
    },
    {
      id: 'catering',
      label: 'Catering & Dining',
      bookWeeksBefore: 16,
      priority: 'immediate',
      questionsHint:
        'Ask about live counter options, plate waste management, and tasting sessions.',
    },
    {
      id: 'photography',
      label: 'Photography & Cinematography',
      bookWeeksBefore: 16,
      priority: 'immediate',
      questionsHint: 'Verify team size, delivery timelines for teaser video, and drone licensing.',
    },
    {
      id: 'decor',
      label: 'Floral & Thematic Decor',
      bookWeeksBefore: 12,
      priority: 'normal',
      questionsHint: 'Clarify seasonal floral substitutions and rigging/lighting inclusions.',
    },
    {
      id: 'attire',
      label: 'Bridal & Groom Attire',
      bookWeeksBefore: 12,
      priority: 'normal',
      questionsHint: 'Check trial alteration dates and delivery buffer windows.',
    },
    {
      id: 'makeup',
      label: 'Bridal Makeup & Styling',
      bookWeeksBefore: 8,
      priority: 'normal',
      questionsHint: 'Confirm bridal trial, draped saree assistance, and bridesmaid team support.',
    },
    {
      id: 'entertainment',
      label: 'Music, DJ & Sound',
      bookWeeksBefore: 6,
      priority: 'normal',
      questionsHint: 'Confirm sound licenses (PPL/IPRS) and guest song requests protocol.',
    },
    {
      id: 'logistics',
      label: 'Guest Hospitality & Transport',
      bookWeeksBefore: 4,
      priority: 'normal',
      questionsHint: 'Verify driver standby allowances and luggage management shuttles.',
    },
  ]),

  rules: Object.freeze([
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
        return Boolean(
          ctx.request.wedding?.dietary && ctx.request.wedding.dietary.trim().length > 0,
        );
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
  ]),

  promptContext:
    'A traditional yet modern wedding requiring harmonious rituals, guest hospitality, emotional resonance, and precise multi-day timing.',

  templates: Object.freeze({
    summary:
      'A comprehensive, memorable wedding plan balancing grand celebrations with realistic budget discipline.',
    rationales: Object.freeze({
      venue: 'The venue anchors the ambiance, guest flow, and ceremonial dignity of the wedding.',
      catering: 'Catering accounts for the largest guest touchpoint and reflects your hospitality.',
      decor: 'Sets the visual theme and floral atmosphere across all key ceremonies.',
      photography: 'Preserves heirloom memories and wedding milestones for a lifetime.',
      attire: 'Outfits and styling for the bride, groom, and immediate wedding party.',
      entertainment: 'DJs, traditional musicians, and sound systems keeping energy vibrant.',
      makeup: 'Professional bridal makeup and styling for extended photo durability.',
      logistics: 'Seamless guest transportation, room allocations, and luggage assistance.',
      contingency: 'Crucial reserve for last-minute headcounts, overtime fees, or tips.',
    }),
    categoryTips: Object.freeze({
      venue: [
        'Verify generator power backup coverage.',
        'Clarify curfew rules for outdoor amplified music.',
      ],
      catering: [
        'Book a formal tasting 4 weeks before.',
        'Confirm exact plate count audit protocol.',
      ],
      decor: [
        'Choose seasonal local flowers to reduce waste and cost.',
        'Re-use stage floral arrangements for reception.',
      ],
      photography: [
        'Share a detailed shot list of VIP family members.',
        'Confirm delivery date for raw high-res photos.',
      ],
      attire: [
        'Schedule the final fitting 10 days before the wedding.',
        'Keep a compact bridal emergency sewing kit.',
      ],
      entertainment: [
        'Provide a "do-not-play" list to the DJ.',
        'Confirm microphone wireless range for mandap vows.',
      ],
      makeup: [
        'Book a hair and makeup trial with your ceremony veil.',
        'Request waterproof, long-wear cosmetic formulations.',
      ],
      logistics: [
        'Create a designated WhatsApp broadcast group for guests.',
        'Assign a dedicated hospitality captain.',
      ],
      contingency: [
        'Keep ₹10,000 in crisp petty cash for day-of emergency vendor tips.',
        'Never spend contingency before the wedding week.',
      ],
    }),
    vendorQuestions: Object.freeze({
      venue: [
        'What are the overtime fees per hour past midnight?',
        'Are outside sound and decor vendors permitted without royalty fees?',
      ],
      catering: [
        'What is the server-to-guest ratio on the floor?',
        'How is unconsumed packaged food handed over at closing?',
      ],
      photography: [
        'Will you personally shoot the wedding, or send associate shooters?',
        'What is your turnaround time for the highlight film?',
      ],
      decor: [
        'Is rigging and truss structure included in the quote?',
        'Do you handle teardown immediately post-event?',
      ],
      attire: [
        'How many alterations are covered in the purchase price?',
        'What is the expedited delivery policy?',
      ],
      makeup: [
        'Does the quote include touch-ups between rituals?',
        'Do you provide false lashes and hairstyling hairpieces?',
      ],
      entertainment: [
        'Do you possess necessary regional music performance licenses?',
        'What backup sound gear do you carry onsite?',
      ],
      logistics: [
        'Are fuel and toll taxes included in vehicle day rates?',
        'What is the vehicle standby protocol during ceremonies?',
      ],
    }),
    vendorRedFlags: Object.freeze({
      venue: [
        'Refusing to provide emergency power backup in writing.',
        'Vague refund policies regarding unforeseen venue damages.',
      ],
      catering: [
        'Unwillingness to accommodate hygienic kitchen visits.',
        'Extra hidden charges for basic cutlery and water service.',
      ],
      photography: [
        'No physical backup camera gear during the event.',
        'Over 6 months turnaround for photo delivery.',
      ],
      decor: [
        'Substituting promised exotic flowers with cheap artificial greenery without prior consent.',
        'Poor electrical safety on stage lighting cables.',
      ],
      attire: [
        'No written promised delivery date on tailoring bill.',
        'Unwilling to allow a fitting before final payment.',
      ],
      makeup: [
        'Using unbranded or unhygienic shared cosmetic applicators.',
        'Unpunctual arrival during trial.',
      ],
      entertainment: [
        'Playing prohibited explicit music at family ceremonies.',
        'No secondary audio console in case of mixer burnout.',
      ],
      logistics: [
        'Unlicensed commercial drivers.',
        'Vehicles lacking functioning air conditioning.',
      ],
    }),
    ideas: Object.freeze({
      themes: [
        'Royal Heritage with Marigold Accents',
        'Minimalist Pastel Garden Soirée',
        'Regal Velvet & Candlelit Twilight',
      ],
      activities: [
        'Live Shehnai & Sitar Welcome',
        'Interactive Polaroid Guestbook Wall',
        'Sangeet Flashmob Coordination',
      ],
      menu: [
        'Live Artisanal Chaat Counter',
        'Signature Regional Biryani Handi',
        'Kulfi & Warm Jalebi Tasting Bar',
      ],
      decor: [
        'Brass Diya Chandelier Installations',
        'Fairy Light Canopy over Dining Courtyard',
        'Custom Calligraphy Welcome Signage',
      ],
      extras: [
        'Curated Welcome Snack Hampers in Guest Rooms',
        'Personalized Embroidered Stoles for Baaraat',
        'Morning Herbal Tea Bar for Elders',
      ],
    }),
  }),
});
