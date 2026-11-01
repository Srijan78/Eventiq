// @ts-check
/**
 * @fileoverview Birthday profile strategy assembly.
 */

import { budgetAllocation, childBudgetAllocation, perGuestBands } from './allocation.js';
import { timelineMilestones } from './milestones.js';
import { vendorCategories } from './vendors.js';
import { rules } from './rules.js';
import { promptContext, templates } from './templates.js';

export const birthdayProfile = Object.freeze({
  id: 'birthday',
  label: 'Birthday Party',
  budgetAllocation,
  childBudgetAllocation,
  perGuestBands,
  timelineMilestones,
  vendorCategories,
  rules,
  promptContext,
  templates,
});
