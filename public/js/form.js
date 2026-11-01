/**
 * @fileoverview Form validation, dynamic field switching, and payload extraction.
 */

import { LIMITS } from './shared/limits.js';

/**
 * Toggles visibility of dynamic event-specific fieldsets.
 * @param {string} eventType
 * @param {HTMLFormElement} form
 */
export function updateDynamicFields(eventType, form) {
  const weddingFields = form.querySelector('#fields-wedding');
  const birthdayFields = form.querySelector('#fields-birthday');
  const communityFields = form.querySelector('#fields-community');
  const otherFields = form.querySelector('#fields-other');

  if (weddingFields) {
    weddingFields.hidden = eventType !== 'wedding';
  }
  if (birthdayFields) {
    birthdayFields.hidden = eventType !== 'birthday';
  }
  if (communityFields) {
    communityFields.hidden = eventType !== 'community';
  }
  if (otherFields) {
    otherFields.hidden = eventType !== 'other';
    const eventNameInput = form.querySelector('#field-event-name');
    if (eventNameInput) {
      eventNameInput.required = eventType === 'other';
    }
  }
}

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

/**
 * Extracts specific profile-driven fields from form.
 *
 * @param {string} eventType
 * @param {FormData} formData
 * @returns {object}
 */
function extractProfileSpecificData(eventType, formData) {
  if (eventType === 'wedding') {
    return {
      wedding: {
        functions: formData.getAll('weddingFunctions').map(String),
        indoor: formData.get('weddingIndoor') !== 'false',
        dietary: String(formData.get('weddingDietary') || '').trim(),
      },
    };
  }
  if (eventType === 'birthday') {
    const ageRaw = formData.get('birthdayAge');
    return {
      birthday: {
        age: ageRaw ? parseInt(String(ageRaw), 10) : undefined,
        surprise: formData.get('birthdaySurprise') === 'true',
        indoor: formData.get('birthdayIndoor') !== 'false',
      },
    };
  }
  if (eventType === 'community') {
    const crowdRaw = formData.get('communityCrowd');
    const sponsorRaw = formData.get('communitySponsorship');
    return {
      community: {
        expectedCrowd: crowdRaw ? parseInt(String(crowdRaw), 10) : undefined,
        sponsorshipTarget: sponsorRaw ? parseInt(String(sponsorRaw), 10) : 0,
        indoor: formData.get('communityIndoor') === 'true',
        isPublic: formData.get('communityPublic') !== 'false',
      },
    };
  }
  return {};
}

/**
 * Serializes form data into structured request object.
 *
 * @param {HTMLFormElement} form
 * @returns {object} Request object
 */
export function extractFormData(form) {
  const formData = new FormData(form);
  const eventType = String(formData.get('eventType') || 'generic').toLowerCase();

  const baseData = {
    eventType,
    eventDate: String(formData.get('eventDate') || ''),
    guests: parseInt(String(formData.get('guests')), 10),
    budget: parseInt(String(formData.get('budget')), 10),
    city: String(formData.get('city') || '').trim(),
    costLevel: String(formData.get('costLevel') || 'average'),
    theme: String(formData.get('theme') || '').trim(),
    notes: String(formData.get('notes') || '').trim(),
  };

  if (eventType === 'other') {
    baseData.eventName = String(formData.get('eventName') || '').trim();
  }

  const profileData = extractProfileSpecificData(eventType, formData);
  return { ...baseData, ...profileData };
}

/**
 * Populates profile-specific fields from saved request.
 *
 * @param {HTMLFormElement} form
 * @param {object} req
 * @param {(id: string, val: any) => void} setVal
 */
function populateProfileFields(form, req, setVal) {
  if (req.wedding) {
    const fns = req.wedding.functions || [];
    const fnBoxes = form.querySelectorAll('input[name="weddingFunctions"]');
    for (const b of fnBoxes) {
      b.checked = fns.includes(b.value);
    }
    setVal('#field-wedding-dietary', req.wedding.dietary);
    const indoorSelect = form.querySelector('#field-wedding-indoor');
    if (indoorSelect) {
      indoorSelect.value = req.wedding.indoor ? 'true' : 'false';
    }
  }

  if (req.birthday) {
    setVal('#field-birthday-age', req.birthday.age);
    const surpriseSelect = form.querySelector('#field-birthday-surprise');
    if (surpriseSelect) {
      surpriseSelect.value = req.birthday.surprise ? 'true' : 'false';
    }
  }

  if (req.community) {
    setVal('#field-community-crowd', req.community.expectedCrowd);
    setVal('#field-community-sponsorship', req.community.sponsorshipTarget);
  }
}

/**
 * Fills form inputs from a previously saved request object.
 *
 * @param {HTMLFormElement} form
 * @param {object} req
 */
export function populateForm(form, req) {
  if (!form || !req) {
    return;
  }

  const setVal = (id, val) => {
    const el = form.querySelector(id);
    if (el && val !== undefined && val !== null) {
      el.value = val;
    }
  };

  setVal('#field-event-type', req.eventType);
  setVal('#field-date', req.eventDate);
  setVal('#field-guests', req.guests);
  setVal('#field-budget', req.budget);
  setVal('#field-city', req.city);
  setVal('#field-cost-level', req.costLevel || 'average');
  setVal('#field-theme', req.theme);
  setVal('#field-notes', req.notes);
  setVal('#field-event-name', req.eventName);

  updateDynamicFields(req.eventType, form);
  populateProfileFields(form, req, setVal);
}
