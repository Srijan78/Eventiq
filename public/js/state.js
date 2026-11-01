/**
 * @fileoverview Browser state management and localStorage persistence (FR-34 & FR-36).
 */

const STORAGE_KEYS = Object.freeze({
  CURRENT_PLAN: 'eventiq_last_plan_session',
  CHECKLIST_PREFIX: 'eventiq_checklist_',
});

function safeGet(key, fallback = null) {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    void err;
    return fallback;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    void err;
    return false;
  }
}

function safeRemove(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (err) {
    void err;
    return false;
  }
}

export const stateManager = Object.freeze({
  savePlan(request, plan) {
    const payload = {
      request,
      plan,
      savedAt: new Date().toISOString(),
    };
    safeSet(STORAGE_KEYS.CURRENT_PLAN, JSON.stringify(payload));
  },

  loadSavedPlan() {
    const raw = safeGet(STORAGE_KEYS.CURRENT_PLAN);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch (err) {
      void err;
      return null;
    }
  },

  clearSavedPlan() {
    safeRemove(STORAGE_KEYS.CURRENT_PLAN);
  },

  saveChecklist(planId, checkedMap) {
    if (!planId) {
      return;
    }
    safeSet(`${STORAGE_KEYS.CHECKLIST_PREFIX}${planId}`, JSON.stringify(checkedMap));
  },

  loadChecklist(planId) {
    if (!planId) {
      return {};
    }
    const raw = safeGet(`${STORAGE_KEYS.CHECKLIST_PREFIX}${planId}`);
    if (!raw) {
      return {};
    }
    try {
      return JSON.parse(raw);
    } catch (err) {
      void err;
      return {};
    }
  },
});
