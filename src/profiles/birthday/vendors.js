// @ts-check
/**
 * @fileoverview Birthday vendor categories.
 */

export const vendorCategories = Object.freeze([
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
    questionsHint:
      'Inquire about kid-friendly bite portions, beverage stations, and heating equipment.',
  },
  {
    id: 'cake',
    label: 'Bespoke Bakery & Cake Designer',
    bookWeeksBefore: 2,
    priority: 'normal',
    questionsHint:
      'Confirm delivery timing to the venue, structural support for multi-tier, and allergen options.',
  },
  {
    id: 'entertainment',
    label: 'Party Host, Games & Magic / DJ',
    bookWeeksBefore: 4,
    priority: 'normal',
    questionsHint:
      'Verify age-appropriate interactive activities, equipment setup, and session duration.',
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
    questionsHint:
      'Ensure age-suitable curation and keep extra gift units for unexpected siblings.',
  },
  {
    id: 'photography',
    label: 'Event Photography',
    bookWeeksBefore: 3,
    priority: 'normal',
    questionsHint:
      'Ask about candid cake-cutting coverage and turnaround time for edited pictures.',
  },
]);
