/**
 * @fileoverview Frozen system constants and configuration thresholds for Eventiq.
 */

export const CONSTANTS = Object.freeze({
  VALIDATION: Object.freeze({
    GUEST_MIN: 1,
    GUEST_MAX: 5000,
    BUDGET_MIN: 1000,
    BUDGET_MAX: 100000000,
    CITY_MAX_LENGTH: 80,
    THEME_MAX_LENGTH: 80,
    NOTES_MAX_LENGTH: 500,
    EVENT_NAME_MAX_LENGTH: 60,
    DATE_MAX_YEARS_AHEAD: 3,
    MAX_BODY_SIZE_BYTES: 20480, // 20 KB
  }),

  COST_LEVELS: Object.freeze({
    LOW: 'low',
    AVERAGE: 'average',
    HIGH: 'high',
  }),

  COST_MULTIPLIERS: Object.freeze({
    low: 0.8,
    average: 1.0,
    high: 1.3,
  }),

  BUDGET: Object.freeze({
    CONTINGENCY_FLOOR_PERCENT: 5,
    CURRENCY_CODE: 'INR',
    CURRENCY_SYMBOL: '₹',
  }),

  SEVERITY: Object.freeze({
    LOW: 1,
    MEDIUM: 2,
    HIGH: 3,
  }),

  RULE_SHIFTS: Object.freeze({
    TIGHT_CATERING: 4,
    TIGHT_DECOR: -4,
    INTIMATE_VENUE: -5,
    INTIMATE_CATERING: 5,
  }),

  SEASONS: Object.freeze({
    MONSOON_MONTHS: Object.freeze([6, 7, 8, 9]), // June to September
    WEDDING_PEAK_MONTHS: Object.freeze([10, 11, 12, 1, 2]), // October to February
  }),

  TIMELINE: Object.freeze({
    URGENT_WEEKS: 4,
    VERY_URGENT_WEEKS: 1,
    SHORT_NOTICE_DAYS: 60,
    DAYS_PER_WEEK: 7,
  }),

  CROWD_THRESHOLDS: Object.freeze({
    LARGE_GUESTS: 400,
    SMALL_GUESTS: 30,
    COMMUNITY_NOC_CROWD: 500,
  }),

  BIRTHDAY: Object.freeze({
    CHILD_AGE_MAX: 12,
    TEEN_AGE_MIN: 13,
    TEEN_AGE_MAX: 19,
    CHILD_SUPERVISOR_RATIO: 8, // 1 adult per 8 children
    MILESTONE_AGES: Object.freeze([18, 21, 30, 40, 50, 60]),
  }),

  CACHE: Object.freeze({
    DEFAULT_TTL_SECONDS: 3600,
    DEFAULT_MAX_ENTRIES: 100,
  }),

  RATE_LIMIT: Object.freeze({
    DEFAULT_GENERAL_PER_MIN: 60,
    DEFAULT_LLM_PER_MIN: 10,
  }),

  GEMINI: Object.freeze({
    DEFAULT_MODEL: 'gemini-3.5-flash-lite',
    TIMEOUT_MS: 15000,
    MAX_RETRIES: 2,
    INITIAL_RETRY_DELAY_MS: 1000,
  }),
});
