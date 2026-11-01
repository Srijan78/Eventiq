/**
 * @fileoverview In-memory LRU Cache with TTL and canonical SHA-256 key hashing (Section 9.7).
 */

import { createHash } from 'node:crypto';
import { ENV } from '../config/env.js';
import { CONSTANTS } from '../config/constants.js';

export const PROMPT_VERSION = '1.0.0';
export const PROFILE_VERSION = '1.0.0';

/**
 * Deeply sorts object keys alphabetically to produce canonical JSON.
 *
 * @param {any} obj
 * @returns {any}
 */
function canonicalize(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(canonicalize);
  }
  const sorted = {};
  for (const key of Object.keys(obj).sort()) {
    sorted[key] = canonicalize(obj[key]);
  }
  return sorted;
}

/**
 * Computes deterministic SHA-256 cache key per PRD Section 9.7.
 *
 * @param {object} req - Normalized, validated request
 * @param {string} [modelName=CONSTANTS.GEMINI.DEFAULT_MODEL]
 * @param {string} [todayUtcDate] - Today's date in YYYY-MM-DD UTC
 * @returns {string} SHA-256 hex digest
 */
/**
 * Normalizes wedding specific properties for canonical cache key.
 *
 * @param {object|undefined} wedding
 * @returns {object|undefined}
 */
function normalizeWedding(wedding) {
  if (!wedding) {
    return undefined;
  }
  return {
    functions: (wedding.functions || []).map((f) => String(f).toLowerCase().trim()).sort(),
    indoor: Boolean(wedding.indoor),
    dietary: (wedding.dietary || '').toLowerCase().trim(),
  };
}

/**
 * Normalizes community specific properties for canonical cache key.
 *
 * @param {object|undefined} community
 * @returns {object|undefined}
 */
function normalizeCommunity(community) {
  if (!community) {
    return undefined;
  }
  return {
    expectedCrowd: community.expectedCrowd,
    sponsorshipTarget: community.sponsorshipTarget,
    indoor: Boolean(community.indoor),
    isPublic: community.isPublic,
  };
}

/**
 * Normalizes request fields for canonical cache key computation.
 *
 * @param {object} req
 * @returns {object}
 */
function normalizeRequestForCache(req) {
  const birthday = req.birthday
    ? {
        age: req.birthday.age,
        surprise: Boolean(req.birthday.surprise),
        indoor: Boolean(req.birthday.indoor),
      }
    : undefined;

  return {
    eventType: req.eventType,
    eventDate: req.eventDate,
    guests: req.guests,
    budget: req.budget,
    city: (req.city || '').toLowerCase().trim(),
    costLevel: req.costLevel || 'average',
    theme: (req.theme || '').toLowerCase().trim(),
    eventName: (req.eventName || '').toLowerCase().trim(),
    notes: (req.notes || '').trim(),
    wedding: normalizeWedding(req.wedding),
    birthday,
    community: normalizeCommunity(req.community),
  };
}

/**
 * Computes deterministic SHA-256 cache key per Section 9.7.
 * Key depends on: canonical request, today UTC date, model name, and profile/prompt version.
 *
 * @param {object} req - Normalized, validated request
 * @param {string} [modelName=CONSTANTS.GEMINI.DEFAULT_MODEL]
 * @param {string} [todayUtcDate] - Today's date in YYYY-MM-DD UTC
 * @returns {string} SHA-256 hex digest
 */
export function buildCacheKey(
  req,
  modelName = ENV.GEMINI_MODEL || CONSTANTS.GEMINI.DEFAULT_MODEL,
  todayUtcDate = new Date().toISOString().split('T')[0],
) {
  const normalizedForCache = normalizeRequestForCache(req);

  const canonicalObject = {
    request: canonicalize(normalizedForCache),
    todayUtcDate,
    profileVersion: PROFILE_VERSION,
    promptVersion: PROMPT_VERSION,
    model: modelName,
  };

  const jsonStr = JSON.stringify(canonicalObject);
  return createHash('sha256').update(jsonStr).digest('hex');
}

/**
 * In-memory LRU Cache with TTL expiration.
 */
export class LruCache {
  /**
   * @param {number} [maxEntries=100]
   * @param {number} [ttlSeconds=3600]
   */
  constructor(
    maxEntries = ENV.CACHE_MAX_ENTRIES || CONSTANTS.CACHE.DEFAULT_MAX_ENTRIES,
    ttlSeconds = ENV.CACHE_TTL_SECONDS || CONSTANTS.CACHE.DEFAULT_TTL_SECONDS,
  ) {
    this.maxEntries = maxEntries;
    this.ttlMs = ttlSeconds * 1000;
    this.map = new Map();
  }

  /**
   * Retrieves an item if present and unexpired.
   * Promotes item to most recently used.
   *
   * @param {string} key
   * @returns {any|null}
   */
  get(key) {
    if (!this.map.has(key)) {
      return null;
    }

    const entry = this.map.get(key);
    const now = Date.now();

    if (now > entry.expiresAt) {
      this.map.delete(key);
      return null;
    }

    // Refresh LRU order (delete and re-insert)
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  /**
   * Stores an item with TTL. Evicts oldest if exceeding capacity.
   *
   * @param {string} key
   * @param {any} value
   */
  set(key, value) {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxEntries) {
      // Evict oldest item (first entry in Map iterator)
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey);
      }
    }

    this.map.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  /**
   * Clears all entries.
   */
  clear() {
    this.map.clear();
  }

  /**
   * Returns current active entry count.
   * @returns {number}
   */
  get size() {
    return this.map.size;
  }
}

export const planCache = new LruCache();
