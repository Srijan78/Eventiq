// @ts-check
/**
 * @fileoverview Community gathering vendor categories.
 */

export const vendorCategories = Object.freeze([
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
    questionsHint: 'Plan bulk hydration dispensers and hygienic eco-friendly distribution points.',
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
]);
