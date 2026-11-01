/**
 * @fileoverview Request payload extraction and form field population.
 */

import {
  extractProfileSpecificData,
  populateProfileFields,
  updateDynamicFields,
} from './formProfileFields.js';

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
