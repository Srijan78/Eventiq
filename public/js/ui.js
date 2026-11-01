/**
 * @fileoverview Main UI orchestrator: coordinates section views and plan rendering.
 * Strictly adheres to safe DOM construction using textContent and createElement (NO innerHTML).
 */

import { el } from './domUtils.js';
import { postExportIcs } from './api.js';
import { renderBudget } from './budgetView.js';
import { renderTimeline } from './timelineView.js';
import { renderVendors } from './vendorsView.js';
import { renderIdeas } from './ideasView.js';

export { renderBudget } from './budgetView.js';
export { renderTimeline } from './timelineView.js';
export { renderVendors } from './vendorsView.js';
export { renderIdeas } from './ideasView.js';

/**
 * Appends critical warnings list to summary box.
 *
 * @param {string[]} warnings
 * @param {HTMLElement} summaryBox
 */
function appendWarnings(warnings, summaryBox) {
  if (!warnings?.length) {
    return;
  }
  const warningsBox = el('div', 'warnings-box');
  warningsBox.appendChild(el('h3', 'warnings-title', 'Advisory Warnings & Constraints'));

  const list = el('ul', 'warnings-list');
  for (const w of warnings) {
    list.appendChild(el('li', 'warning-item', w));
  }
  warningsBox.appendChild(list);
  summaryBox.appendChild(warningsBox);
}

/**
 * Renders the top summary bar: mode banner, health meter, and critical warnings.
 *
 * @param {object} plan
 * @param {HTMLElement} container
 */
export function renderSummaryBar(plan, container) {
  const summaryBox = el('div', 'summary-bar');

  if (plan.mode === 'offline') {
    const offlineBanner = el('div', 'banner-offline');
    offlineBanner.setAttribute('role', 'status');
    offlineBanner.appendChild(el('span', 'badge badge-offline', 'Offline Mode'));
    offlineBanner.appendChild(el('span', 'banner-text', ' Generated via deterministic event profile templates. AI service is currently unavailable or unconfigured.'));
    summaryBox.appendChild(offlineBanner);
  }

  const healthBox = el('div', `health-meter health-${plan.budget.health.level}`);
  const healthHeader = el('div', 'health-header');
  healthHeader.appendChild(el('span', 'health-label', `Budget Feasibility: ${plan.budget.health.level.toUpperCase()}`));
  healthBox.appendChild(healthHeader);
  healthBox.appendChild(el('p', 'health-reason', plan.budget.health.reason));
  summaryBox.appendChild(healthBox);

  if (plan.summary) {
    summaryBox.appendChild(el('p', 'plan-summary-text', plan.summary));
  }

  appendWarnings(plan.warnings, summaryBox);
  container.appendChild(summaryBox);
}

/**
 * Renders the "Why this plan?" expandable panel.
 *
 * @param {Array<object>} firedRules
 * @param {HTMLElement} container
 */
export function renderWhyPanel(firedRules, container) {
  const details = el('details', 'why-panel');
  details.appendChild(el('summary', 'why-summary', `Why this plan? (${firedRules.length} Contextual Rules Applied)`));

  const body = el('div', 'why-body');
  const list = el('div', 'rules-list');

  for (const r of firedRules) {
    const item = el('div', 'rule-entry');
    const header = el('div', 'rule-header');
    header.appendChild(el('span', 'badge badge-rule', r.id));
    header.appendChild(el('strong', 'rule-desc', r.description));
    item.appendChild(header);
    item.appendChild(el('p', 'rule-effect', `Effect: ${r.effect}`));
    list.appendChild(item);
  }

  body.appendChild(list);
  details.appendChild(body);
  container.appendChild(details);
}

/**
 * Renders the top 3 risk radar items.
 *
 * @param {Array<object>} risks
 * @param {HTMLElement} container
 */
export function renderRiskRadar(risks, container) {
  const section = el('div', 'risk-radar');
  section.appendChild(el('h3', 'risk-heading', 'Risk Radar & Mitigation Strategy'));

  const list = el('div', 'risk-list');
  for (const r of risks) {
    const card = el('div', `risk-card severity-${r.severity}`);
    const head = el('div', 'risk-card-head');
    head.appendChild(el('span', 'risk-title', r.title));
    head.appendChild(
      el(
        'span',
        `badge badge-severity-${r.severity}`,
        r.severity === 3 ? 'High Risk' : r.severity === 2 ? 'Medium Risk' : 'Low Risk',
      ),
    );
    card.appendChild(head);
    card.appendChild(el('p', 'risk-mitigation', `Mitigation: ${r.mitigation}`));
    list.appendChild(card);
  }

  section.appendChild(list);
  container.appendChild(section);
}

/**
 * Downloads generated iCalendar string.
 *
 * @param {object} plan
 * @param {HTMLButtonElement} btnIcs
 */
async function handleIcsDownload(plan, btnIcs) {
  try {
    btnIcs.disabled = true;
    btnIcs.textContent = 'Generating .ics...';
    const eventName = plan.request.eventName || plan.summary.split(' ')[0] || 'Event';
    const icsString = await postExportIcs({ eventName, timeline: plan.timeline });

    const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${eventName.toLowerCase().replace(/\s+/g, '-')}-timeline.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (err) {
    alert(`Export failed: ${err.message}`);
  } finally {
    btnIcs.disabled = false;
    btnIcs.textContent = 'Download .ics Calendar';
  }
}

/**
 * Renders the export action bar (download ICS, print).
 *
 * @param {object} plan
 * @param {HTMLElement} container
 */
export function renderExportBar(plan, container) {
  const bar = el('div', 'export-bar');
  const btnIcs = el('button', 'btn btn-primary', 'Download .ics Calendar');
  btnIcs.type = 'button';
  btnIcs.addEventListener('click', () => handleIcsDownload(plan, btnIcs));

  const btnPrint = el('button', 'btn btn-secondary', 'Print Event Plan');
  btnPrint.type = 'button';
  btnPrint.addEventListener('click', () => window.print());

  bar.appendChild(btnIcs);
  bar.appendChild(btnPrint);
  container.appendChild(bar);
}

/**
 * Builds sticky jump-link navigation anchor list.
 *
 * @returns {HTMLElement} Nav element
 */
function buildJumpNav() {
  const nav = el('nav', 'results-nav');
  nav.setAttribute('aria-label', 'Plan sections navigation');
  const navList = el('ul', 'results-nav-list');

  const navItems = [
    { href: '#budget', label: 'Budget' },
    { href: '#timeline', label: 'Timeline' },
    { href: '#vendors', label: 'Vendors' },
    { href: '#ideas', label: 'Ideas' },
  ];

  for (const item of navItems) {
    const li = el('li');
    const a = el('a', 'results-nav-link', item.label);
    a.href = item.href;
    li.appendChild(a);
    navList.appendChild(li);
  }
  nav.appendChild(navList);
  return nav;
}

/**
 * Main orchestrator rendering the complete plan into the results container.
 * Target: under 40 lines.
 *
 * @param {object} plan
 * @param {HTMLElement} resultsContainer
 */
export function renderPlan(plan, resultsContainer) {
  resultsContainer.textContent = '';
  resultsContainer.hidden = false;

  const header = el('div', 'results-header');
  const h2 = el('h2', 'results-main-title', 'Your Context-Aware Event Plan');
  h2.id = 'results-heading';
  h2.setAttribute('tabindex', '-1');
  header.appendChild(h2);
  resultsContainer.appendChild(header);

  resultsContainer.appendChild(buildJumpNav());
  renderExportBar(plan, resultsContainer);
  renderSummaryBar(plan, resultsContainer);
  renderWhyPanel(plan.firedRules, resultsContainer);
  renderRiskRadar(plan.risks, resultsContainer);

  renderBudget(plan.budget, resultsContainer, plan);
  renderTimeline(plan.timeline, resultsContainer, plan.request.eventName || 'Event');
  renderVendors(plan.vendors, resultsContainer, plan.id);
  renderIdeas(plan.ideas, resultsContainer);

  h2.focus();
}
