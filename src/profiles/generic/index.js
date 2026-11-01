// @ts-check
/**
 * @fileoverview Generic / Custom profile strategy assembly.
 */

import { budgetAllocation, perGuestBands } from './allocation.js';
import { timelineMilestones } from './milestones.js';
import { vendorCategories } from './vendors.js';
import { rules } from './rules.js';
import { promptContext, templates } from './templates.js';

export const genericProfile = Object.freeze({
  id: 'generic',
  label: 'Custom Event',
  budgetAllocation,
  perGuestBands,
  timelineMilestones,
  vendorCategories,
  rules,
  promptContext,
  templates,
});
