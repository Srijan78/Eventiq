/**
 * @fileoverview Interactive checklist management with persistent state.
 */

import { stateManager } from './state.js';

/**
 * Initializes checklist interaction listeners for a rendered plan.
 *
 * @param {string} planId
 * @param {HTMLElement} container
 */
export function initChecklist(planId, container) {
  if (!container || !planId) {
    return;
  }

  const savedState = stateManager.loadChecklist(planId);
  const checkboxes = container.querySelectorAll('input[type="checkbox"][data-check-id]');

  for (const cb of checkboxes) {
    const checkId = cb.getAttribute('data-check-id');
    if (checkId && savedState[checkId]) {
      cb.checked = true;
      const label = cb.closest('.checklist-item');
      if (label) {
        label.classList.add('is-completed');
      }
    }

    cb.addEventListener('change', () => {
      const currentState = stateManager.loadChecklist(planId);
      if (cb.checked) {
        currentState[checkId] = true;
      } else {
        delete currentState[checkId];
      }
      stateManager.saveChecklist(planId, currentState);

      const label = cb.closest('.checklist-item');
      if (label) {
        label.classList.toggle('is-completed', cb.checked);
      }
    });
  }
}

