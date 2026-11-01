/**
 * @fileoverview Single shared source of truth for validation bounds, cost levels, and event types.
 * Directly importable by both Node.js ESM backend and browser vanilla ES modules.
 */

export const LIMITS = Object.freeze({
  GUESTS: Object.freeze({
    MIN: 1,
    MAX: 5000,
  }),
  BUDGET: Object.freeze({
    MIN: 1000,
    MAX: 100000000,
  }),
  STRINGS: Object.freeze({
    CITY_MAX_LENGTH: 60,
    THEME_MAX_LENGTH: 60,
    NOTES_MAX_LENGTH: 500,
    EVENT_NAME_MAX_LENGTH: 60,
    DIETARY_MAX_LENGTH: 200,
  }),
  BIRTHDAY: Object.freeze({
    AGE_MIN: 1,
    AGE_MAX: 120,
  }),
  COMMUNITY: Object.freeze({
    CROWD_MAX: 50000,
    SPONSORSHIP_MAX: 100000000,
  }),
  EVENT_TYPES: Object.freeze(['wedding', 'birthday', 'community', 'other']),
  COST_LEVELS: Object.freeze(['low', 'average', 'high']),
});
