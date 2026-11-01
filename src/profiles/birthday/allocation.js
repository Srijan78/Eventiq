// @ts-check
/**
 * @fileoverview Birthday budget allocation (adult and child variants) and bands.
 */

export const budgetAllocation = Object.freeze({
  venue: 25,
  catering: 35,
  decor: 10,
  photography: 3,
  entertainment: 12,
  cake: 6,
  gifts: 3,
  contingency: 6,
});

export const childBudgetAllocation = Object.freeze({
  venue: 15,
  catering: 30,
  decor: 12,
  photography: 3,
  entertainment: 18,
  cake: 7,
  gifts: 8,
  contingency: 7,
});

export const perGuestBands = Object.freeze({
  comfortable: 800,
  tight: 400,
});
