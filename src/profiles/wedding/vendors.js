// @ts-check
/**
 * @fileoverview Wedding vendor categories.
 */

export const vendorCategories = Object.freeze([
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
    questionsHint: 'Ask about live counter options, plate waste management, and tasting sessions.',
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
]);
