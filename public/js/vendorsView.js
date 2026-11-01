/**
 * @fileoverview Vendor section renderer with checklists, questions, and red flags.
 */

import { el } from './domUtils.js';
import { initChecklist } from './checklist.js';

/**
 * Creates an interactive checklist block for a vendor.
 *
 * @param {object} v - Vendor category item
 * @returns {HTMLElement} Checklist group container
 */
function createVendorChecklist(v) {
  const checkList = el('div', 'checklist-group');
  v.checklist.forEach((itemText, idx) => {
    const checkId = `${v.categoryId}_task_${idx}`;
    const itemLabel = el('label', 'checklist-item');

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.setAttribute('data-check-id', checkId);

    const span = el('span', 'checklist-text', itemText);
    itemLabel.appendChild(cb);
    itemLabel.appendChild(span);
    checkList.appendChild(itemLabel);
  });
  return checkList;
}

/**
 * Creates a single vendor category card.
 *
 * @param {object} v - Vendor category item
 * @returns {HTMLElement} Vendor card element
 */
function createVendorCard(v) {
  const card = el('div', 'vendor-card');
  const cardHead = el('div', 'vendor-card-header');
  cardHead.appendChild(el('h3', 'vendor-title', v.label));
  const prioBadge = el(
    'span',
    `badge ${v.priority === 'immediate' ? 'badge-urgent' : 'badge-normal'}`,
    v.priority === 'immediate' ? 'Lock In Now' : `Book by: ${v.bookByDate}`,
  );
  cardHead.appendChild(prioBadge);
  card.appendChild(cardHead);

  if (v.checklist && v.checklist.length > 0) {
    card.appendChild(el('h4', 'sub-heading', 'Action Checklist'));
    card.appendChild(createVendorChecklist(v));
  }

  if (v.questions && v.questions.length > 0) {
    card.appendChild(el('h4', 'sub-heading', 'Key Questions to Ask'));
    const qList = el('ul', 'bullet-list');
    for (const q of v.questions) {
      qList.appendChild(el('li', '', q));
    }
    card.appendChild(qList);
  }

  if (v.redFlags && v.redFlags.length > 0) {
    card.appendChild(el('h4', 'sub-heading sub-heading-danger', 'Red Flags to Avoid'));
    const rfList = el('ul', 'bullet-list red-flags-list');
    for (const rf of v.redFlags) {
      rfList.appendChild(el('li', '', rf));
    }
    card.appendChild(rfList);
  }

  return card;
}

/**
 * Renders the vendor guidance section with tickable checklist.
 *
 * @param {Array<object>} vendors
 * @param {HTMLElement} container
 * @param {string} planId
 */
export function renderVendors(vendors, container, planId) {
  const section = el('section', 'results-section');
  section.id = 'vendors';
  section.setAttribute('aria-labelledby', 'heading-vendors');

  const h2 = el('h2', 'section-heading', 'Vendor Checklists & Due Diligence');
  h2.id = 'heading-vendors';
  section.appendChild(h2);

  const grid = el('div', 'vendor-grid');
  for (const v of vendors) {
    grid.appendChild(createVendorCard(v));
  }

  section.appendChild(grid);
  container.appendChild(section);

  initChecklist(planId, section);
}
