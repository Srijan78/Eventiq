/**
 * @fileoverview Browser state management and localStorage persistence (FR-34 & FR-36).
 */

const STORAGE_KEYS = Object.freeze({
  CURRENT_PLAN: 'eventiq_last_plan_session',
  CHECKLIST_PREFIX: 'eventiq_checklist_',
});

export const stateManager = Object.freeze({
  /**
   * Persists the active plan and original request to localStorage.
   *
   * @param {object} request
   * @param {object} plan
   */
  savePlan(request, plan) {
    try {
      const payload = {
        request,
        plan,
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEYS.CURRENT_PLAN, JSON.stringify(payload));
    } catch {
      // Gracefully handle storage quota or private-browsing restrictions
    }
  },

  /**
   * Retrieves the previously stored plan session.
   * @returns {{ request: object, plan: object, savedAt: string } | null}
   */
  loadSavedPlan() {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_PLAN);
      if (!raw) {
        return null;
      }
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  /**
   * Clears the saved session from localStorage.
   */
  clearSavedPlan() {
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_PLAN);
    } catch {
      // ignore
    }
  },

  /**
   * Saves checked item IDs for a specific plan's vendor checklist.
   *
   * @param {string} planId
   * @param {Record<string, boolean>} checkedMap
   */
  saveChecklist(planId, checkedMap) {
    if (!planId) {
      return;
    }
    try {
      localStorage.setItem(`${STORAGE_KEYS.CHECKLIST_PREFIX}${planId}`, JSON.stringify(checkedMap));
    } catch {
      // ignore
    }
  },

  /**
   * Loads the checked item states for a given plan ID.
   *
   * @param {string} planId
   * @returns {Record<string, boolean>}
   */
  loadChecklist(planId) {
    if (!planId) {
      return {};
    }
    try {
      const raw = localStorage.getItem(`${STORAGE_KEYS.CHECKLIST_PREFIX}${planId}`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  },
});

