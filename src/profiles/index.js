/**
 * @fileoverview Strategy registry for event profiles.
 * Services and the decision engine consume profiles through this interface
 * without branching on eventType.
 */

import { weddingProfile } from './wedding.js';
import { birthdayProfile } from './birthday.js';
import { communityProfile } from './community.js';
import { genericProfile } from './generic.js';

/**
 * Registry of available event profiles.
 * @type {Readonly<Record<string, object>>}
 */
const PROFILE_REGISTRY = Object.freeze({
  wedding: weddingProfile,
  birthday: birthdayProfile,
  community: communityProfile,
  generic: genericProfile,
  other: genericProfile,
});

/**
 * Retrieves the event profile matching the requested event type.
 * Returns the generic profile if the type is unrecognised or "other".
 *
 * @param {string} [eventType] - Event type identifier
 * @returns {typeof genericProfile} Resolved event profile
 */
export function getProfile(eventType) {
  if (!eventType) {
    return genericProfile;
  }
  const key = String(eventType).toLowerCase().trim();
  return PROFILE_REGISTRY[key] || genericProfile;
}

/**
 * Returns all registered profiles.
 * @returns {Array<object>}
 */
export function getAllProfiles() {
  return [weddingProfile, birthdayProfile, communityProfile, genericProfile];
}

export { weddingProfile, birthdayProfile, communityProfile, genericProfile };
