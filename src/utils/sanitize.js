/* eslint-disable no-control-regex */
/**
 * @fileoverview Text sanitization utilities for prompt injection defense and safe data processing.
 */

import { CONSTANTS } from '../config/constants.js';

// Control characters regex (excluding standard newlines \n, \r and tabs \t)
const CONTROL_CHARS_REGEX = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

/**
 * Sanitizes an untrusted string: strips non-printable control characters,
 * collapses redundant whitespace, trims, and truncates to max length.
 *
 * @param {unknown} input - Raw untrusted input
 * @param {number} [maxLength=500] - Hard upper bound on character length
 * @returns {string} Sanitized string
 */
export function sanitize(input, maxLength = 500) {
  if (typeof input !== 'string') {
    return '';
  }

  return input.replace(CONTROL_CHARS_REGEX, '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
}

/**
 * Sanitizes all user-supplied text properties on a plan request object.
 *
 * @param {object} req - Raw or parsed request payload
 * @returns {object} Shallow copy with cleaned string properties
 */
export function sanitizeRequest(req) {
  if (!req || typeof req !== 'object') {
    return {};
  }

  const cleaned = { ...req };

  if (typeof cleaned.city === 'string') {
    cleaned.city = sanitize(cleaned.city, CONSTANTS.VALIDATION.CITY_MAX_LENGTH);
  }
  if (typeof cleaned.theme === 'string') {
    cleaned.theme = sanitize(cleaned.theme, CONSTANTS.VALIDATION.THEME_MAX_LENGTH);
  }
  if (typeof cleaned.notes === 'string') {
    cleaned.notes = sanitize(cleaned.notes, CONSTANTS.VALIDATION.NOTES_MAX_LENGTH);
  }
  if (typeof cleaned.eventName === 'string') {
    cleaned.eventName = sanitize(cleaned.eventName, CONSTANTS.VALIDATION.EVENT_NAME_MAX_LENGTH);
  }

  // Nested profile fields
  if (cleaned.wedding && typeof cleaned.wedding === 'object') {
    cleaned.wedding = {
      ...cleaned.wedding,
      dietary: sanitize(cleaned.wedding.dietary, 200),
    };
  }

  return cleaned;
}
