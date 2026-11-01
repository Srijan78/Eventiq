// @ts-check
/**
 * @fileoverview Community gathering profile strategy assembly.
 */

import { budgetAllocation, perGuestBands } from './allocation.js';
import { timelineMilestones } from './milestones.js';
import { vendorCategories } from './vendors.js';
import { rules } from './rules.js';
import { promptContext, templates } from './templates.js';

export const communityProfile = Object.freeze({
  id: 'community',
  label: 'Community Event',
  budgetAllocation,
  perGuestBands,
  timelineMilestones,
  vendorCategories,
  rules,
  promptContext,
  templates,
});
