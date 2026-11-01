/**
 * @fileoverview Interactive What-If recalculation module (FR-40).
 */

import { postWhatIf } from './api.js';

/**
 * Creates a labeled numeric input control.
 *
 * @param {{ id: string, labelText: string, value: number, min: number, max: number, step?: number }} options
 * @returns {{ group: HTMLElement, input: HTMLInputElement }}
 */
function createNumberControl({ id, labelText, value, min, max, step }) {
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
 * @param {{ plan: object, guestInput: HTMLInputElement, budgetInput: HTMLInputElement, statusEl: HTMLElement, onRecalculated: Function }} options
 * @returns {() => void} Debounced trigger function
 */
function createRecalculator({ plan, guestInput, budgetInput, statusEl, onRecalculated }) {
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
 * Creates panel header and descriptions.
 *
 * @returns {HTMLElement}
 */
function createWhatIfHeader() {
  const fragment = document.createDocumentFragment();
  const heading = document.createElement('h3');
  heading.className = 'whatif-title';
  heading.textContent = 'Instant What-If Budget Recalculator';
  fragment.appendChild(heading);

  const desc = document.createElement('p');
  desc.className = 'whatif-desc';
  desc.textContent =
    'Adjust guest count or total budget below. Numbers and health feasibility recalculate deterministically with 0 latency.';
  fragment.appendChild(desc);
  return fragment;
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
  box.appendChild(createWhatIfHeader());

  const controlsGrid = document.createElement('div');
  controlsGrid.className = 'whatif-grid';

  const { group: guestGroup, input: guestInput } = createNumberControl({
    id: 'whatif-guests',
    labelText: 'Adjust Guests:',
    value: plan.request.guests,
    min: 1,
    max: 5000,
  });
  const { group: budgetGroup, input: budgetInput } = createNumberControl({
    id: 'whatif-budget',
    labelText: 'Adjust Total Budget (₹):',
    value: plan.request.budget,
    min: 1000,
    max: 100000000,
    step: 500,
  });

  controlsGrid.appendChild(guestGroup);
  controlsGrid.appendChild(budgetGroup);
  box.appendChild(controlsGrid);

  const statusEl = document.createElement('span');
  statusEl.className = 'whatif-status';
  statusEl.setAttribute('role', 'status');
  box.appendChild(statusEl);

  const debouncedHandler = createRecalculator({
    plan,
    guestInput,
    budgetInput,
    statusEl,
    onRecalculated,
  });
  guestInput.addEventListener('input', debouncedHandler);
  budgetInput.addEventListener('input', debouncedHandler);

  container.appendChild(box);
}
