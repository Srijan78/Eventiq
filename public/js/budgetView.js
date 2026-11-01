/**
 * @fileoverview Budget section renderer with table, health meter, and what-if controls.
 */

import { el } from './domUtils.js';
import { initWhatIfControls } from './whatif.js';

/**
 * Builds the visual and textual budget health meter.
 *
 * @param {object} health - Budget health object
 * @returns {HTMLElement}
 */
export function buildHealthMeter(health) {
  const healthBox = el('div', `health-meter health-${health.level}`);
  const healthHeader = el('div', 'health-header');
  const healthLabel = el(
    'span',
    'health-label',
    `Budget Feasibility: ${health.level.toUpperCase()}`,
  );
  healthHeader.appendChild(healthLabel);

  const healthReason = el('p', 'health-reason', health.reason);
  healthBox.appendChild(healthHeader);
  healthBox.appendChild(healthReason);
  return healthBox;
}

/**
 * Creates a single table row for a budget category.
 *
 * @param {object} cat
 * @returns {HTMLTableRowElement}
 */
function createBudgetRow(cat) {
  const row = el('tr');
  row.setAttribute('data-cat-id', cat.id);
  const tdName = el('td', 'cat-name', cat.label || cat.id);
  tdName.setAttribute('scope', 'row');

  const tdPct = el('td', 'cat-pct', `${cat.percent}%`);
  const tdAmt = el('td', 'cat-amt', `₹${cat.amount.toLocaleString('en-IN')}`);

  const tdGuidance = el('td', 'cat-guidance');
  if (cat.rationale) {
    tdGuidance.appendChild(el('p', 'cat-rationale', cat.rationale));
  }
  if (cat.tips && cat.tips.length > 0) {
    const tipsList = el('ul', 'cat-tips-list');
    for (const t of cat.tips) {
      tipsList.appendChild(el('li', '', t));
    }
    tdGuidance.appendChild(tipsList);
  }

  row.appendChild(tdName);
  row.appendChild(tdPct);
  row.appendChild(tdAmt);
  row.appendChild(tdGuidance);
  return row;
}

/**
 * Builds the accessible budget breakdown table.
 *
 * @param {Array<object>} categories - Budget categories
 * @returns {HTMLElement} Table wrapper element
 */
export function buildBudgetTable(categories) {
  const tableWrapper = el('div', 'table-wrapper');
  const table = el('table', 'budget-table');
  table.appendChild(
    el(
      'caption',
      'sr-only',
      'Detailed event budget distribution with exact rupee allocations and rationale',
    ),
  );

  const thead = el('thead');
  const headerRow = el('tr');
  headerRow.appendChild(el('th', '', 'Category')).setAttribute('scope', 'col');
  headerRow.appendChild(el('th', '', 'Share (%)')).setAttribute('scope', 'col');
  headerRow.appendChild(el('th', '', 'Amount (₹)')).setAttribute('scope', 'col');
  headerRow.appendChild(el('th', '', 'Rationale & Tips')).setAttribute('scope', 'col');
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = el('tbody');
  for (const cat of categories) {
    tbody.appendChild(createBudgetRow(cat));
  }

  table.appendChild(tbody);
  tableWrapper.appendChild(table);
  return tableWrapper;
}

/**
 * Builds and connects the interactive What-If panel.
 *
 * @param {object} plan - Active plan object
 * @param {HTMLElement} section - Section container
 * @param {object} statsRefs - References to stat value elements
 */
export function buildWhatIfPanel(plan, section, statsRefs) {
  if (!plan?.request) {
    return;
  }

  initWhatIfControls(plan, section, (updated) => {
    statsRefs.statTotal.textContent = `₹${updated.budget.total.toLocaleString('en-IN')}`;
    statsRefs.statGuest.textContent = `₹${updated.budget.perGuest.toLocaleString('en-IN')}`;

    for (const cat of updated.budget.categories) {
      const row = section.querySelector(`tr[data-cat-id="${cat.id}"]`);
      if (row) {
        const pctEl = row.querySelector('.cat-pct');
        const amtEl = row.querySelector('.cat-amt');
        if (pctEl) {
          pctEl.textContent = `${cat.percent}%`;
        }
        if (amtEl) {
          amtEl.textContent = `₹${cat.amount.toLocaleString('en-IN')}`;
        }
      }
    }

    const healthMeter = document.querySelector('.health-meter');
    if (healthMeter) {
      healthMeter.className = `health-meter health-${updated.budget.health.level}`;
      const label = healthMeter.querySelector('.health-label');
      const reason = healthMeter.querySelector('.health-reason');
      if (label) {
        label.textContent = `Budget Feasibility: ${updated.budget.health.level.toUpperCase()}`;
      }
      if (reason) {
        reason.textContent = updated.budget.health.reason;
      }
    }
  });
}

/**
 * Renders the full Budget section.
 *
 * @param {object} budget - Budget object
 * @param {HTMLElement} container - Results container
 * @param {object} plan - Active plan object
 */
export function renderBudget(budget, container, plan) {
  const section = el('section', 'results-section');
  section.id = 'budget';
  section.setAttribute('aria-labelledby', 'heading-budget');

  const h2 = el('h2', 'section-heading', 'Budget Allocation');
  h2.id = 'heading-budget';
  section.appendChild(h2);

  const statsBar = el('div', 'budget-stats-bar');
  const stat1 = el('div', 'stat-card');
  stat1.appendChild(el('span', 'stat-label', 'Total Budget'));
  const statTotal = el(
    'span',
    'stat-value stat-total-val',
    `₹${budget.total.toLocaleString('en-IN')}`,
  );
  stat1.appendChild(statTotal);

  const stat2 = el('div', 'stat-card');
  stat2.appendChild(el('span', 'stat-label', 'Spend per Guest'));
  const statGuest = el(
    'span',
    'stat-value stat-guest-val',
    `₹${budget.perGuest.toLocaleString('en-IN')}`,
  );
  stat2.appendChild(statGuest);

  const stat3 = el('div', 'stat-card');
  stat3.appendChild(el('span', 'stat-label', 'Allocated Categories'));
  stat3.appendChild(el('span', 'stat-value', String(budget.categories.length)));

  statsBar.appendChild(stat1);
  statsBar.appendChild(stat2);
  statsBar.appendChild(stat3);
  section.appendChild(statsBar);

  buildWhatIfPanel(plan, section, { statTotal, statGuest });
  section.appendChild(buildBudgetTable(budget.categories));
  container.appendChild(section);
}
