/**
 * @fileoverview Interactive What-If recalculation module (FR-40).
 */

import { postWhatIf } from './api.js';

/**
 * Creates a labeled numeric input control.
 *
 * @param {string} id - Input element id
 * @param {string} labelText - Visible label string
 * @param {number} value - Initial value
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} [step] - Numeric step
 * @returns {{ group: HTMLElement, input: HTMLInputElement }}
 */
function createNumberControl(id, labelText, value, min, max, step) {
  const group = document.createElement('div');
  group.className = 'form-group';

  const label = document.createElement('label');
  label.className = 'form-label';
  label.htmlFor = id;
  label.textContent = labelText;

  const input = document.createElement('input');
  input.type = 'number';
  input.id = id;
  input.className = 'form-control';
  input.min = String(min);
  input.max = String(max);
  if (step) {
    input.step = String(step);
  }
  input.value = String(value);

  group.appendChild(label);
  group.appendChild(input);
  return { group, input };
}

/**
 * Creates a debounced recalculation handler.
 *
 * @param {object} plan - Active plan object
 * @param {HTMLInputElement} guestInput
 * @param {HTMLInputElement} budgetInput
 * @param {HTMLElement} statusEl
 * @param {Function} onRecalculated
 * @returns {() => void} Debounced trigger function
 */
function createRecalculator(plan, guestInput, budgetInput, statusEl, onRecalculated) {
  let debounceTimer = null;

  async function execute() {
    const guests = parseInt(guestInput.value, 10);
    const budget = parseInt(budgetInput.value, 10);

    if (isNaN(guests) || guests < 1 || isNaN(budget) || budget < 1000) {
      return;
    }

    try {
      statusEl.textContent = 'Recalculating...';
      const updatedPayload = { ...plan.request, guests, budget };
      const result = await postWhatIf(updatedPayload);
      statusEl.textContent = `Updated: ₹${budget.toLocaleString('en-IN')} across ${guests} guests (₹${result.budget.perGuest.toLocaleString('en-IN')}/guest).`;
      onRecalculated(result);
    } catch (err) {
      statusEl.textContent = `Recalculation error: ${err.message}`;
    }
  }

  return () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(execute, 250);
  };
}

/**
 * Creates and binds What-if recalculation inputs.
 * Target: under 40 lines.
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
  desc.textContent = 'Adjust guest count or total budget below. Numbers and health feasibility recalculate deterministically with 0 latency.';
  box.appendChild(desc);

  const controlsGrid = document.createElement('div');
  controlsGrid.className = 'whatif-grid';

  const { group: guestGroup, input: guestInput } = createNumberControl('whatif-guests', 'Adjust Guests:', plan.request.guests, 1, 5000);
  const { group: budgetGroup, input: budgetInput } = createNumberControl('whatif-budget', 'Adjust Total Budget (₹):', plan.request.budget, 1000, 100000000, 500);

  controlsGrid.appendChild(guestGroup);
  controlsGrid.appendChild(budgetGroup);
  box.appendChild(controlsGrid);

  const statusEl = document.createElement('span');
  statusEl.className = 'whatif-status';
  statusEl.setAttribute('role', 'status');
  box.appendChild(statusEl);

  const debouncedHandler = createRecalculator(plan, guestInput, budgetInput, statusEl, onRecalculated);
  guestInput.addEventListener('input', debouncedHandler);
  budgetInput.addEventListener('input', debouncedHandler);

  container.appendChild(box);
}
