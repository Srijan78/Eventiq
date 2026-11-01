/**
 * @fileoverview API fetch client for Eventiq backend endpoints.
 */

/**
 * Handles standard JSON fetch and extracts formatted server errors.
 *
 * @param {string} endpoint
 * @param {object} [options={}]
 * @returns {Promise<any>}
 */
async function fetchJson(endpoint, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/calendar')) {
    if (!res.ok) {
      throw new Error(`Export failed with HTTP status ${res.status}`);
    }
    return res.text();
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server returned non-JSON response (${res.status})`);
  }

  if (!res.ok) {
    const errorMsg = data?.error?.message || `Request failed with status ${res.status}`;
    const err = new Error(errorMsg);
    err.code = data?.error?.code || 'API_ERROR';
    err.details = data?.error?.details || [];
    err.requestId = data?.error?.requestId || '';
    throw err;
  }

  return data;
}

/**
 * Posts request to generate a full event plan.
 * @param {object} requestData
 * @returns {Promise<object>}
 */
export async function postPlan(requestData) {
  return fetchJson('/api/plan', {
    method: 'POST',
    body: JSON.stringify(requestData),
  });
}

/**
 * Posts what-if parameters for deterministic recalculation.
 * @param {object} whatIfData
 * @returns {Promise<object>}
 */
export async function postWhatIf(whatIfData) {
  return fetchJson('/api/plan/whatif', {
    method: 'POST',
    body: JSON.stringify(whatIfData),
  });
}

/**
 * Downloads .ics calendar attachment.
 * @param {{ eventName: string, timeline: Array<object> }} exportData
 * @returns {Promise<string>} Raw iCalendar text
 */
export async function postExportIcs(exportData) {
  return fetchJson('/api/export/ics', {
    method: 'POST',
    body: JSON.stringify(exportData),
  });
}

