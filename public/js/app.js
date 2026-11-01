/**
 * @fileoverview Main frontend application bootstrapper.
 */

import { postPlan } from './api.js';
import { stateManager } from './state.js';
import { updateDynamicFields, validateClientForm, extractFormData, populateForm } from './form.js';
import { renderPlan } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('plan-form');
  const eventTypeSelect = document.getElementById('field-event-type');
  const resultsContainer = document.getElementById('results-container');
  const loadingRegion = document.getElementById('loading-indicator');
  const globalErrorBox = document.getElementById('global-error');
  const restoreNoticeBox = document.getElementById('restore-notice');

  /**
   * Shows loading overlay / text announced to screen readers.
   * @param {string} msg
   */
  function showLoading(msg = 'Generating your customized event plan...') {
    if (loadingRegion) {
      loadingRegion.textContent = msg;
      loadingRegion.hidden = false;
    }
    if (globalErrorBox) {
      globalErrorBox.hidden = true;
      globalErrorBox.textContent = '';
    }
  }

  /**
   * Hides loading indicator.
   */
  function hideLoading() {
    if (loadingRegion) {
      loadingRegion.hidden = true;
      loadingRegion.textContent = '';
    }
  }

  /**
   * Displays an accessible global error message.
   * @param {string} msg
   */
  function showError(msg) {
    if (globalErrorBox) {
      globalErrorBox.textContent = msg;
      globalErrorBox.hidden = false;
      globalErrorBox.focus();
    }
  }

  // 1. Listen for event type change to toggle dynamic fieldsets
  if (eventTypeSelect && form) {
    eventTypeSelect.addEventListener('change', () => {
      updateDynamicFields(eventTypeSelect.value, form);
    });
    // Initialize default field visibility
    updateDynamicFields(eventTypeSelect.value, form);
  }

  // 2. Handle Plan Generation Form Submit
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!validateClientForm(form)) {
        return;
      }

      const requestPayload = extractFormData(form);

      try {
        showLoading('Calculating budget math, timeline, and vendor checklists...');
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = true;
        }

        const plan = await postPlan(requestPayload);

        // Hide restore notice once a new plan is generated
        if (restoreNoticeBox) {
          restoreNoticeBox.hidden = true;
        }

        // Save to browser session
        stateManager.savePlan(requestPayload, plan);

        // Render results
        renderPlan(plan, resultsContainer);
      } catch (err) {
        showError(err.message || 'Failed to generate plan. Please verify your inputs and retry.');
      } finally {
        hideLoading();
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
          submitBtn.disabled = false;
        }
      }
    });
  }

  // 3. FR-36: Restore previous plan from localStorage on reload
  const savedSession = stateManager.loadSavedPlan();
  if (savedSession && savedSession.plan && savedSession.request) {
    if (restoreNoticeBox) {
      const savedDate = new Date(savedSession.savedAt).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      restoreNoticeBox.textContent = '';
      const textSpan = document.createElement('span');
      textSpan.textContent = `Restored previous plan session from ${savedDate}. `;
      restoreNoticeBox.appendChild(textSpan);

      const regenBtn = document.createElement('button');
      regenBtn.type = 'button';
      regenBtn.className = 'btn btn-outline btn-sm';
      regenBtn.textContent = 'Regenerate Fresh Plan';
      regenBtn.addEventListener('click', () => {
        if (form) {
          form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
        }
      });
      restoreNoticeBox.appendChild(regenBtn);

      const clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.className = 'btn btn-outline btn-sm';
      clearBtn.textContent = 'Dismiss';
      clearBtn.style.marginLeft = '8px';
      clearBtn.addEventListener('click', () => {
        stateManager.clearSavedPlan();
        restoreNoticeBox.hidden = true;
      });
      restoreNoticeBox.appendChild(clearBtn);

      restoreNoticeBox.hidden = false;
    }

    // Prepopulate form inputs
    if (form) {
      populateForm(form, savedSession.request);
    }

    // Render restored plan
    renderPlan(savedSession.plan, resultsContainer);
  }
});
