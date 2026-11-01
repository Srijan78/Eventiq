/**
 * @fileoverview Client-side form input validation and accessible error rendering.
 */

import { LIMITS } from './shared/limits.js';

/**
 * Shows accessible inline validation error for an input.
 *
 * @param {HTMLInputElement|HTMLSelectElement} input
 * @param {string} message
 */
export function setFieldError(input, message) {
  if (!input) {
    return;
  }
  input.setAttribute('aria-invalid', 'true');
  const errorEl = document.getElementById(`${input.id}-error`);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.hidden = false;
  }
}

/**
 * Clears validation error for an input.
 * @param {HTMLInputElement|HTMLSelectElement} input
 */
export function clearFieldError(input) {
  if (!input) {
    return;
  }
  input.removeAttribute('aria-invalid');
  const errorEl = document.getElementById(`${input.id}-error`);
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.hidden = true;
  }
}

/**
 * Clears all inline validation errors in a form.
 * @param {HTMLFormElement} form
 */
export function clearAllErrors(form) {
  const inputs = form.querySelectorAll('[aria-invalid="true"]');
  for (const input of inputs) {
    clearFieldError(input);
  }
  const errorBoxes = form.querySelectorAll('.field-error');
  for (const box of errorBoxes) {
    box.textContent = '';
    box.hidden = true;
  }
}

/**
 * Validates event type and mandatory custom event name.
 *
 * @param {HTMLSelectElement|null} eventTypeSelect
 * @param {HTMLInputElement|null} eventNameInput
 * @returns {boolean}
 */
function validateEventType(eventTypeSelect, eventNameInput) {
  if (!eventTypeSelect || !eventTypeSelect.value) {
    setFieldError(eventTypeSelect, 'Please select an event type.');
    return false;
  }
  if (eventTypeSelect.value === 'other' && (!eventNameInput || !eventNameInput.value.trim())) {
    setFieldError(eventNameInput, 'Please specify an event name for "Other" events.');
    return false;
  }
  return true;
}

/**
 * Validates that event date is non-empty, valid, and not in the past.
 *
 * @param {HTMLInputElement|null} dateInput
 * @returns {boolean}
 */
function validateEventDate(dateInput) {
  if (!dateInput || !dateInput.value) {
    setFieldError(dateInput, 'Please pick an event date.');
    return false;
  }
  const selected = new Date(dateInput.value);
  selected.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(selected.getTime())) {
    setFieldError(dateInput, 'Invalid date.');
    return false;
  }
  if (selected < today) {
    setFieldError(dateInput, 'Event date cannot be in the past.');
    return false;
  }
  return true;
}

/**
 * Validates numeric ranges for guest count and total budget.
 *
 * @param {HTMLInputElement|null} guestsInput
 * @param {HTMLInputElement|null} budgetInput
 * @returns {boolean}
 */
function validateNumericBounds(guestsInput, budgetInput) {
  let valid = true;
  const guests = parseInt(guestsInput?.value, 10);
  if (isNaN(guests) || guests < LIMITS.GUESTS.MIN || guests > LIMITS.GUESTS.MAX) {
    setFieldError(
      guestsInput,
      `Guest count must be between ${LIMITS.GUESTS.MIN} and ${LIMITS.GUESTS.MAX.toLocaleString('en-IN')}.`,
    );
    valid = false;
  }

  const budget = parseInt(budgetInput?.value, 10);
  if (isNaN(budget) || budget < LIMITS.BUDGET.MIN || budget > LIMITS.BUDGET.MAX) {
    setFieldError(
      budgetInput,
      `Total budget must be between ₹${LIMITS.BUDGET.MIN.toLocaleString('en-IN')} and ₹${LIMITS.BUDGET.MAX.toLocaleString('en-IN')}.`,
    );
    valid = false;
  }
  return valid;
}

/**
 * Validates form inputs client-side before submission.
 *
 * @param {HTMLFormElement} form
 * @returns {boolean} True if all valid
 */
export function validateClientForm(form) {
  clearAllErrors(form);

  const eventTypeSelect = form.querySelector('#field-event-type');
  const dateInput = form.querySelector('#field-date');
  const guestsInput = form.querySelector('#field-guests');
  const budgetInput = form.querySelector('#field-budget');
  const eventNameInput = form.querySelector('#field-event-name');

  const validTypes = validateEventType(eventTypeSelect, eventNameInput);
  const validDate = validateEventDate(dateInput);
  const validNumbers = validateNumericBounds(guestsInput, budgetInput);

  return validTypes && validDate && validNumbers;
}
