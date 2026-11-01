/**
 * @fileoverview Main frontend application bootstrapper.
 */

import { postPlan } from './api.js';
import { stateManager } from './state.js';
import { updateDynamicFields, validateClientForm, extractFormData, populateForm } from './form.js';
import { renderPlan } from './ui.js';

/**
 * Creates UI feedback helpers (loading indicator and global error display).
 *
 * @param {HTMLElement|null} loadingRegion
 * @param {HTMLElement|null} globalErrorBox
 * @returns {{ showLoading: (msg?: string) => void, hideLoading: () => void, showError: (msg: string) => void }}
 */
function createFeedbackController(loadingRegion, globalErrorBox) {
  return {
    showLoading(msg = 'Generating your event plan. This may take up to 15 seconds...') {
      if (loadingRegion) {
        loadingRegion.textContent = msg;
        loadingRegion.hidden = false;
      }
      if (globalErrorBox) {
        globalErrorBox.hidden = true;
        globalErrorBox.textContent = '';
      }
    },
    hideLoading() {
      if (loadingRegion) {
        loadingRegion.hidden = true;
        loadingRegion.textContent = '';
      }
    },
    showError(msg) {
      if (globalErrorBox) {
        globalErrorBox.textContent = msg;
        globalErrorBox.hidden = false;
        globalErrorBox.focus();
      }
    },
  };
}

/**
 * Updates submit button disabled and busy states.
 * @param {HTMLButtonElement|null} submitBtn
 * @param {boolean} isBusy
 */
function setSubmitState(submitBtn, isBusy) {
  if (!submitBtn) {
    return;
  }
  submitBtn.disabled = isBusy;
  if (isBusy) {
    submitBtn.setAttribute('aria-busy', 'true');
  } else {
    submitBtn.removeAttribute('aria-busy');
  }
}

/**
 * Handles form submission to generate a new event plan.
 *
 * @param {HTMLFormElement} form
 * @param {HTMLElement|null} resultsContainer
 * @param {HTMLElement|null} restoreNoticeBox
 * @param {ReturnType<typeof createFeedbackController>} feedback
 */
function bindFormSubmit(form, resultsContainer, restoreNoticeBox, feedback) {
  let isSubmitting = false;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting || !validateClientForm(form)) {
      return;
    }

    const requestPayload = extractFormData(form);
    const submitBtn = form.querySelector('button[type="submit"]');

    try {
      isSubmitting = true;
      setSubmitState(submitBtn, true);
      feedback.showLoading(
        'Generating your customized event plan with AI. This may take up to 15 seconds...',
      );

      const plan = await postPlan(requestPayload);
      if (restoreNoticeBox) {
        restoreNoticeBox.hidden = true;
      }

      stateManager.savePlan(requestPayload, plan);
      renderPlan(plan, resultsContainer);
    } catch (err) {
      feedback.showError(
        err.message || 'Failed to generate plan. Please verify your inputs and retry.',
      );
    } finally {
      isSubmitting = false;
      feedback.hideLoading();
      setSubmitState(submitBtn, false);
    }
  });
}

/**
 * Builds and mounts restore session notice elements into the banner.
 *
 * @param {object} savedSession
 * @param {HTMLFormElement|null} form
 * @param {HTMLElement} restoreNoticeBox
 */
function buildRestoreBanner(savedSession, form, restoreNoticeBox) {
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
    form?.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
  });
  restoreNoticeBox.appendChild(regenBtn);

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.className = 'btn btn-outline btn-sm btn-dismiss';
  clearBtn.textContent = 'Dismiss';
  clearBtn.addEventListener('click', () => {
    stateManager.clearSavedPlan();
    restoreNoticeBox.hidden = true;
  });
  restoreNoticeBox.appendChild(clearBtn);
  restoreNoticeBox.hidden = false;
}

/**
 * Restores previous saved plan from localStorage if available.
 *
 * @param {HTMLFormElement|null} form
 * @param {HTMLElement|null} resultsContainer
 * @param {HTMLElement|null} restoreNoticeBox
 */
function restoreSavedSession(form, resultsContainer, restoreNoticeBox) {
  const savedSession = stateManager.loadSavedPlan();
  if (!savedSession || !savedSession.plan || !savedSession.request) {
    return;
  }

  if (restoreNoticeBox) {
    buildRestoreBanner(savedSession, form, restoreNoticeBox);
  }

  if (form) {
    populateForm(form, savedSession.request);
  }
  renderPlan(savedSession.plan, resultsContainer);
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('plan-form');
  const eventTypeSelect = document.getElementById('field-event-type');
  const resultsContainer = document.getElementById('results-container');
  const loadingRegion = document.getElementById('loading-indicator');
  const globalErrorBox = document.getElementById('global-error');
  const restoreNoticeBox = document.getElementById('restore-notice');

  const feedback = createFeedbackController(loadingRegion, globalErrorBox);

  if (eventTypeSelect && form) {
    eventTypeSelect.addEventListener('change', () =>
      updateDynamicFields(eventTypeSelect.value, form),
    );
    updateDynamicFields(eventTypeSelect.value, form);
  }

  if (form) {
    bindFormSubmit(form, resultsContainer, restoreNoticeBox, feedback);
  }

  restoreSavedSession(form, resultsContainer, restoreNoticeBox);
});
