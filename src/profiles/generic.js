/**
 * @fileoverview Generic / Custom profile specification for Eventiq (for "other" event types).
 */

export const genericProfile = Object.freeze({
  id: 'generic',
  label: 'Custom Event',

  budgetAllocation: Object.freeze({
    venue: 25,
    catering: 30,
    decor: 12,
    entertainment: 13,
    gifts: 4,
    logistics: 8,
    contingency: 8,
  }),

  perGuestBands: Object.freeze({
    comfortable: 1000,
    tight: 500,
  }),

  timelineMilestones: Object.freeze([
    { id: 'm-concept-venue', label: 'Define Event Objectives & Secure Venue', weeksBefore: 12 },
    {
      id: 'm-budget-vendors',
      label: 'Finalize Vendor Contracts (Caterer & AV/Entertainment)',
      weeksBefore: 8,
    },
    {
      id: 'm-invites-agenda',
      label: 'Issue Invitations & Confirm Run-of-Show Agenda',
      weeksBefore: 4,
    },
    { id: 'm-logistics-headcount', label: 'Lock RSVPs, Seating & Logistics Setup', weeksBefore: 2 },
    { id: 'm-final-checks', label: 'Final Vendor Confirmation & Materials Check', weeksBefore: 1 },
    { id: 'm-event-day', label: 'Event Execution & Onsite Coordination', weeksBefore: 0 },
  ]),

  vendorCategories: Object.freeze([
    {
      id: 'venue',
      label: 'Event Venue & Space Hire',
      bookWeeksBefore: 12,
      priority: 'immediate',
      questionsHint: 'Clarify seating capacity layouts, accessibility, and AV compatibility.',
    },
    {
      id: 'catering',
      label: 'Food & Beverage Catering',
      bookWeeksBefore: 8,
      priority: 'immediate',
      questionsHint:
        'Inquire about dietary alternatives, buffet vs plated service, and setup times.',
    },
    {
      id: 'entertainment',
      label: 'AV, Master of Ceremonies & Entertainment',
      bookWeeksBefore: 6,
      priority: 'normal',
      questionsHint:
        'Confirm projector screens, microphone counts, and speaker technical requirements.',
    },
    {
      id: 'decor',
      label: 'Signage, Props & Space Styling',
      bookWeeksBefore: 4,
      priority: 'normal',
      questionsHint:
        'Ask about welcome display stands, directional arrows, and stage backdrop materials.',
    },
    {
      id: 'logistics',
      label: 'Event Operations & Transportation',
      bookWeeksBefore: 4,
      priority: 'normal',
      questionsHint:
        'Verify guest reception desks, registration scanning, and badge printing tools.',
    },
  ]),

  rules: Object.freeze([
    {
      id: 'G-DEFAULT',
      description: 'Standard custom event operational framework',
      applies: () => true,
      apply: (ctx) => {
        const title = ctx.request.eventName || 'Custom Event';
        return {
          warnings: [
            `Planning for "${title}": Applying standard baseline split with contingency reserve. Customize vendor scopes according to your goals.`,
          ],
        };
      },
    },
  ]),

  promptContext:
    'A versatile, well-organized bespoke event balancing engaging programming, comfortable hospitality, clear agenda, and prudent financial management.',

  templates: Object.freeze({
    summary:
      'A balanced, goal-oriented event framework built for dependable execution and pleasant guest experience.',
    rationales: Object.freeze({
      venue: 'The physical space creating focus, seating comfort, and professional presentation.',
      catering: 'Essential hospitality ensuring guest comfort and social networking ease.',
      decor: 'Thematic branding, directional signage, and visual identity.',
      entertainment: 'Audio-visual clarity, presentation equipment, or keynote/program delivery.',
      gifts: 'Meaningful commemorative items or attendee takeaway materials.',
      logistics: 'Flawless registration, guest coordination, and operational supplies.',
      contingency:
        'Safeguard for unexpected technical needs, additional attendees, or minor venue overages.',
    }),
    categoryTips: Object.freeze({
      venue: [
        'Test microphone acoustics and projector visibility from the furthest row.',
        'Verify air conditioning and ventilation capacity.',
      ],
      catering: [
        'Keep coffee, tea, and water easily accessible throughout.',
        'Confirm cleanup schedule does not disrupt the closing session.',
      ],
      decor: [
        'Focus budget on the main stage and photo entrance area.',
        'Ensure all branding logos are high-resolution vector prints.',
      ],
      entertainment: [
        'Schedule a comprehensive AV test 90 minutes before attendees arrive.',
        'Carry backup presentation slides on a secondary USB drive.',
      ],
      gifts: [
        'Select practical items that attendees will retain and use.',
        'Keep a 10% buffer count for walk-in VIPs.',
      ],
      logistics: [
        'Use a digital check-in spreadsheet on tablets for quick registration.',
        'Print a master contact sheet of all vendor drivers.',
      ],
      contingency: [
        'Reserve funds for last-minute emergency adapter cables or supplies.',
        'Never commit 100% of budget prior to event day.',
      ],
    }),
    vendorQuestions: Object.freeze({
      venue: [
        'Is high-speed wireless internet included for attendees?',
        'What is the load-in elevator capacity and schedule?',
      ],
      catering: [
        'Can beverages be replenished on a per-consumption basis?',
        'Do you provide dietary allergen cards for the buffet?',
      ],
      entertainment: [
        'Is an audio technician present during all presentations?',
        'Are video splitters and HDMI adapters supplied?',
      ],
      decor: [
        'Does the quote cover same-day removal after closing?',
        'Can signboards be repurposed for future editions?',
      ],
      logistics: [
        'What is your contingency if an equipment delivery driver is delayed?',
        'Do you have backup registration scanners?',
      ],
    }),
    vendorRedFlags: Object.freeze({
      venue: [
        'No on-duty venue technician during weekend slots.',
        'Non-functional climate control.',
      ],
      catering: [
        'Running out of drinking water or staple refreshments.',
        'Poor hygiene among serving staff.',
      ],
      entertainment: [
        'Audio feedback screeches or failing microphones during speeches.',
        'Unfamiliarity with basic presentation software.',
      ],
      decor: [
        'Misspelled banners or crooked backdrop installations.',
        'Refusing to remove heavy stands post-event.',
      ],
      logistics: [
        'Disorganized registration causing long lines in entrance lobbies.',
        'Unresponsive contact numbers on event morning.',
      ],
    }),
    ideas: Object.freeze({
      themes: [
        'Modern Minimalist & Professional Clean',
        'Interactive Collaborative Studio',
        'Warm Contemporary Social Lounge',
      ],
      activities: [
        'Curated Speed-Networking Icebreaker',
        'Live Digital Polling & Audience Q&A',
        'Recognition Ceremony & Story Showcase',
      ],
      menu: [
        'Artisan Coffee & Finger Pastries',
        'Healthy Grain Bowls & Fresh Fruit Skewers',
        'Curated Grazing Platters & Mocktails',
      ],
      decor: [
        'Clean Monochrome Banners with Pop Accents',
        'Sleek Acrylic Signage Stands',
        'Warm Accent Up-Lighting on Presentation Stage',
      ],
      extras: [
        'Digital Resource Hub Accessible via QR Code',
        'Branded Eco-Friendly Bamboo Stationery',
        'Custom Lanyard Badges with Schedule',
      ],
    }),
  }),
});
