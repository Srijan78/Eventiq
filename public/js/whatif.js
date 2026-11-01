/**
 * @fileoverview Interactive What-If recalculation module (FR-40).
 */

import { postWhatIf } from './api.js';

/**
 * Creates and binds What-if recalculation inputs.
 *
 * @param {object} plan - Active plan object
 * @param {HTMLElement} container
 * @param {Function} onRecalculated - Callback when whatif updates numbers
 */
export function initWhatIfControls(plan, container, onRecalculated) {
  const box = document.createElement('div');
  box.className = 'whatif-panel';

  const heading = document.createElement('h3');
  heading.className = 'whatif-title';
  heading.textContent = 'Instant What-If Budget Recalculator';
  box.appendChild(heading);

  const desc = document.createElement('p');
  desc.className = 'whatif-desc';
  desc.textContent =
    'Adjust guest count or total budget below. Numbers and health feasibility recalculate deterministically with 0 latency.';
  box.appendChild(desc);

  const controlsGrid = document.createElement('div');
  controlsGrid.className = 'whatif-grid';

  // Guest count input
  const guestGroup = document.createElement('div');
  guestGroup.className = 'form-group';
  const guestLabel = document.createElement('label');
  guestLabel.className = 'form-label';
  guestLabel.htmlFor = 'whatif-guests';
  guestLabel.textContent = 'Adjust Guests:';
  const guestInput = document.createElement('input');
  guestInput.type = 'number';
  guestInput.id = 'whatif-guests';
  guestInput.className = 'form-control';
  guestInput.min = '1';
  guestInput.max = '5000';
  guestInput.value = String(plan.request.guests);
  guestGroup.appendChild(guestLabel);
  guestGroup.appendChild(guestInput);

  // Budget input
  const budgetGroup = document.createElement('div');
  budgetGroup.className = 'form-group';
  const budgetLabel = document.createElement('label');
  budgetLabel.className = 'form-label';
  budgetLabel.htmlFor = 'whatif-budget';
  budgetLabel.textContent = 'Adjust Total Budget (₹):';
  const budgetInput = document.createElement('input');
  budgetInput.type = 'number';
  budgetInput.id = 'whatif-budget';
  budgetInput.className = 'form-control';
  budgetInput.min = '1000';
  budgetInput.max = '100000000';
  budgetInput.step = '500';
  budgetInput.value = String(plan.request.budget);
  budgetGroup.appendChild(budgetLabel);
  budgetGroup.appendChild(budgetInput);

  controlsGrid.appendChild(guestGroup);
  controlsGrid.appendChild(budgetGroup);
  box.appendChild(controlsGrid);

  // Status message
  const statusEl = document.createElement('span');
  statusEl.className = 'whatif-status';
  statusEl.setAttribute('role', 'status');
  box.appendChild(statusEl);

  let debounceTimer = null;

  async function triggerRecalculate() {
    const guests = parseInt(guestInput.value, 10);
    const budget = parseInt(budgetInput.value, 10);

    if (isNaN(guests) || guests < 1 || isNaN(budget) || budget < 1000) {
      return;
    }

    try {
      statusEl.textContent = 'Recalculating...';
      const updatedPayload = {
        ...plan.request,
        guests,
        budget,
      };

      const result = await postWhatIf(updatedPayload);
      statusEl.textContent = `Updated: ₹${budget.toLocaleString('en-IN')} across ${guests} guests (₹${result.budget.perGuest.toLocaleString('en-IN')}/guest).`;
      onRecalculated(result);
    } catch (err) {
      statusEl.textContent = `Recalculation error: ${err.message}`;
    }
  }

  const debouncedHandler = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(triggerRecalculate, 250);
  };

  guestInput.addEventListener('input', debouncedHandler);
  budgetInput.addEventListener('input', debouncedHandler);

  container.appendChild(box);
}
