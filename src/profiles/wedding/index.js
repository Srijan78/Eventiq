// @ts-check
/**
 * @fileoverview Wedding profile strategy assembly.
 */

import { budgetAllocation, perGuestBands } from './allocation.js';
import { timelineMilestones } from './milestones.js';
import { vendorCategories } from './vendors.js';
import { rules } from './rules.js';
import { promptContext, templates } from './templates.js';

export const weddingProfile = Object.freeze({
  id: 'wedding',
  label: 'Wedding',
  budgetAllocation,
  perGuestBands,
  timelineMilestones,
  vendorCategories,
  rules,
  promptContext,
  templates,
});
