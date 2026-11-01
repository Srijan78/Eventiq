// @ts-check
/**
 * @fileoverview Generic / Custom event vendor categories.
 */

export const vendorCategories = Object.freeze([
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
    questionsHint: 'Inquire about dietary alternatives, buffet vs plated service, and setup times.',
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
    questionsHint: 'Verify guest reception desks, registration scanning, and badge printing tools.',
  },
]);
