// @ts-check
/**
 * @fileoverview Generic / Custom event budget allocation and bands.
 */

export const budgetAllocation = Object.freeze({
  venue: 25,
  catering: 30,
  decor: 12,
  entertainment: 13,
  gifts: 4,
  logistics: 8,
  contingency: 8,
});

export const perGuestBands = Object.freeze({
  comfortable: 1000,
  tight: 500,
});
