/**
 * @fileoverview DOM rendering functions for Eventiq plan results.
 * Strictly adheres to safe DOM construction using textContent and createElement (NO innerHTML).
 */

import { initChecklist } from './checklist.js';
import { postExportIcs } from './api.js';

/**
 * Creates an element with optional class name and text content.
 *
 * @param {string} tag
 * @param {string} [className='']
 * @param {string} [text='']
 * @returns {HTMLElement}
 */
function el(tag, className = '', text = '') {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text) {
    element.textContent = text;
  }
  return element;
}

/**
 * Builds Google Calendar web URL from milestone and event name.
 *
 * @param {object} milestone
 * @param {string} eventName
 * @returns {string}
 */
function buildGCalUrl(milestone, eventName) {
  const startDate = milestone.dueDate.replace(/-/g, '');
  const d = new Date(milestone.dueDate);
  d.setDate(d.getDate() + 1);
  const endDate = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const title = encodeURIComponent(`${eventName}: ${milestone.label}`);
  const details = encodeURIComponent(
    milestone.tasks?.map((t) => `${t.title}: ${t.detail}`).join('\n') || 'Milestone tasks',
  );
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}`;
}

/**
 * Renders the top summary bar: mode banner, health meter, and critical warnings.
 *
 * @param {object} plan
 * @param {HTMLElement} container
 */
export function renderSummaryBar(plan, container) {
  const summaryBox = el('div', 'summary-bar');

  // 1. Offline Mode Banner if applicable
  if (plan.mode === 'offline') {
    const offlineBanner = el('div', 'banner-offline');
    offlineBanner.setAttribute('role', 'status');
    const badge = el('span', 'badge badge-offline', 'Offline Mode');
    const text = el(
      'span',
      'banner-text',
      ' Generated via deterministic event profile templates. AI service is currently unavailable or unconfigured.',
    );
    offlineBanner.appendChild(badge);
    offlineBanner.appendChild(text);
    summaryBox.appendChild(offlineBanner);
  }

  // 2. Budget Health Meter (Never convey information by color alone!)
  const healthBox = el('div', `health-meter health-${plan.budget.health.level}`);
  const healthHeader = el('div', 'health-header');
  const healthLabel = el(
    'span',
    'health-label',
    `Budget Feasibility: ${plan.budget.health.level.toUpperCase()}`,
  );
  healthHeader.appendChild(healthLabel);

  const healthReason = el('p', 'health-reason', plan.budget.health.reason);
  healthBox.appendChild(healthHeader);
  healthBox.appendChild(healthReason);
  summaryBox.appendChild(healthBox);

  // 3. Plan Summary Text
  if (plan.summary) {
    const summaryP = el('p', 'plan-summary-text', plan.summary);
    summaryBox.appendChild(summaryP);
  }

  // 4. Critical Warnings
  if (plan.warnings && plan.warnings.length > 0) {
    const warningsBox = el('div', 'warnings-box');
    const warnTitle = el('h3', 'warnings-title', 'Advisory Warnings & Constraints');
    warningsBox.appendChild(warnTitle);

    const list = el('ul', 'warnings-list');
    for (const w of plan.warnings) {
      list.appendChild(el('li', 'warning-item', w));
    }
    warningsBox.appendChild(list);
    summaryBox.appendChild(warningsBox);
  }

  container.appendChild(summaryBox);
}

/**
 * Renders the Budget Breakdown section with accessible data table.
 *
 * @param {object} budget
 * @param {HTMLElement} container
 */
export function renderBudget(budget, container) {
  const section = el('section', 'results-section');
  section.id = 'budget';
  section.setAttribute('aria-labelledby', 'heading-budget');

  const h2 = el('h2', 'section-heading', 'Budget Allocation');
  h2.id = 'heading-budget';
  section.appendChild(h2);

  const statsBar = el('div', 'budget-stats-bar');
  const stat1 = el('div', 'stat-card');
  stat1.appendChild(el('span', 'stat-label', 'Total Budget'));
  stat1.appendChild(el('span', 'stat-value', `₹${budget.total.toLocaleString('en-IN')}`));

  const stat2 = el('div', 'stat-card');
  stat2.appendChild(el('span', 'stat-label', 'Spend per Guest'));
  stat2.appendChild(el('span', 'stat-value', `₹${budget.perGuest.toLocaleString('en-IN')}`));

  const stat3 = el('div', 'stat-card');
  stat3.appendChild(el('span', 'stat-label', 'Allocated Categories'));
  stat3.appendChild(el('span', 'stat-value', String(budget.categories.length)));

  statsBar.appendChild(stat1);
  statsBar.appendChild(stat2);
  statsBar.appendChild(stat3);
  section.appendChild(statsBar);

  // Accessible Table
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
  for (const cat of budget.categories) {
    const row = el('tr');
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
    tbody.appendChild(row);
  }
  table.appendChild(tbody);
  tableWrapper.appendChild(table);
  section.appendChild(tableWrapper);

  container.appendChild(section);
}

/**
 * Renders the milestone timeline schedule.
 *
 * @param {Array<object>} timeline
 * @param {HTMLElement} container
 * @param {string} eventName
 */
export function renderTimeline(timeline, container, eventName) {
  const section = el('section', 'results-section');
  section.id = 'timeline';
  section.setAttribute('aria-labelledby', 'heading-timeline');

  const h2 = el('h2', 'section-heading', 'Timeline & Milestones');
  h2.id = 'heading-timeline';
  section.appendChild(h2);

  const list = el('div', 'timeline-list');
  for (const m of timeline) {
    const card = el('div', `timeline-card ${m.urgent ? 'is-urgent' : ''}`);

    const header = el('div', 'timeline-card-header');
    const titleBox = el('div');
    const title = el('h3', 'milestone-title', m.label);
    const dateText = el(
      'span',
      'milestone-due-date',
      `Due Date: ${m.dueDate} (${m.weeksLeft === 0 ? 'Today / Immediate' : `${m.weeksLeft} week${m.weeksLeft > 1 ? 's' : ''} left`})`,
    );
    titleBox.appendChild(title);
    titleBox.appendChild(dateText);
    header.appendChild(titleBox);

    if (m.urgent) {
      header.appendChild(el('span', 'badge badge-urgent', 'Immediate Action'));
    }

    const gcalLink = el('a', 'btn btn-outline btn-sm', 'Add to Google Calendar');
    gcalLink.href = buildGCalUrl(m, eventName);
    gcalLink.target = '_blank';
    gcalLink.rel = 'noopener noreferrer';
    header.appendChild(gcalLink);

    card.appendChild(header);

    if (m.tasks && m.tasks.length > 0) {
      const tasksUl = el('ul', 'milestone-tasks');
      for (const t of m.tasks) {
        const li = el('li', 'task-item');
        li.appendChild(el('strong', 'task-title', `${t.title}: `));
        li.appendChild(document.createTextNode(t.detail || ''));
        tasksUl.appendChild(li);
      }
      card.appendChild(tasksUl);
    }

    list.appendChild(card);
  }
  section.appendChild(list);
  container.appendChild(section);
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

    // Interactive checklist
    if (v.checklist && v.checklist.length > 0) {
      const checkTitle = el('h4', 'sub-heading', 'Action Checklist');
      card.appendChild(checkTitle);

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
      card.appendChild(checkList);
    }

    // Questions to Ask
    if (v.questions && v.questions.length > 0) {
      card.appendChild(el('h4', 'sub-heading', 'Key Questions to Ask'));
      const qList = el('ul', 'bullet-list');
      for (const q of v.questions) {
        qList.appendChild(el('li', '', q));
      }
      card.appendChild(qList);
    }

    // Red Flags
    if (v.redFlags && v.redFlags.length > 0) {
      card.appendChild(el('h4', 'sub-heading sub-heading-danger', 'Red Flags to Avoid'));
      const rfList = el('ul', 'bullet-list red-flags-list');
      for (const rf of v.redFlags) {
        rfList.appendChild(el('li', '', rf));
      }
      card.appendChild(rfList);
    }

    grid.appendChild(card);
  }

  section.appendChild(grid);
  container.appendChild(section);

  // Initialize interactive checklist
  initChecklist(planId, section);
}

/**
 * Renders the personalized ideas & concept section.
 *
 * @param {object} ideas
 * @param {HTMLElement} container
 */
export function renderIdeas(ideas, container) {
  const section = el('section', 'results-section');
  section.id = 'ideas';
  section.setAttribute('aria-labelledby', 'heading-ideas');

  const h2 = el('h2', 'section-heading', 'Personalized Ideas & Creative Concepts');
  h2.id = 'heading-ideas';
  section.appendChild(h2);

  const grid = el('div', 'ideas-grid');

  const addIdeaBlock = (title, items) => {
    if (!items || items.length === 0) {
      return;
    }
    const card = el('div', 'idea-card');
    card.appendChild(el('h3', 'idea-card-title', title));
    const ul = el('ul', 'bullet-list');
    for (const item of items) {
      ul.appendChild(el('li', '', item));
    }
    card.appendChild(ul);
    grid.appendChild(card);
  };

  addIdeaBlock('Themes & Aesthetics', ideas.themes);
  addIdeaBlock('Engaging Activities & Entertainment', ideas.activities);
  addIdeaBlock('Catering & Signature Menu Concepts', ideas.menu);
  addIdeaBlock('Decor & Floral Highlights', ideas.decor);
  addIdeaBlock('Special Touches & Guest Experience', ideas.extras);

  section.appendChild(grid);
  container.appendChild(section);
}

/**
 * Renders the "Why this plan?" expandable panel.
 *
 * @param {Array<object>} firedRules
 * @param {HTMLElement} container
 */
export function renderWhyPanel(firedRules, container) {
  const details = el('details', 'why-panel');
  const summary = el(
    'summary',
    'why-summary',
    `Why this plan? (${firedRules.length} Contextual Rules Applied)`,
  );
  details.appendChild(summary);

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
 * Renders the export action bar (download ICS, print).
 *
 * @param {object} plan
 * @param {HTMLElement} container
 */
export function renderExportBar(plan, container) {
  const bar = el('div', 'export-bar');

  const btnIcs = el('button', 'btn btn-primary', 'Download .ics Calendar');
  btnIcs.type = 'button';
  btnIcs.addEventListener('click', async () => {
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
  });

  const btnPrint = el('button', 'btn btn-secondary', 'Print Event Plan');
  btnPrint.type = 'button';
  btnPrint.addEventListener('click', () => {
    window.print();
  });

  bar.appendChild(btnIcs);
  bar.appendChild(btnPrint);
  container.appendChild(bar);
}

/**
 * Main orchestrator rendering the complete plan into the results container.
 *
 * @param {object} plan
 * @param {HTMLElement} resultsContainer
 */
export function renderPlan(plan, resultsContainer) {
  resultsContainer.textContent = ''; // Safe wipe
  resultsContainer.hidden = false;

  const eventName = plan.request.eventName || 'Event';

  // 1. Header with Results Title
  const header = el('div', 'results-header');
  const h2 = el('h2', 'results-main-title', 'Your Context-Aware Event Plan');
  h2.id = 'results-heading';
  h2.setAttribute('tabindex', '-1');
  header.appendChild(h2);
  resultsContainer.appendChild(header);

  // 2. Sticky Jump-Link Navigation (Accessible Anchor Links, No Tabs)
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
  resultsContainer.appendChild(nav);

  // 3. Export Action Bar
  renderExportBar(plan, resultsContainer);

  // 4. Summary Bar
  renderSummaryBar(plan, resultsContainer);

  // 5. Why this plan? Panel
  renderWhyPanel(plan.firedRules, resultsContainer);

  // 6. Risk Radar
  renderRiskRadar(plan.risks, resultsContainer);

  // 7. Stacked Sections
  renderBudget(plan.budget, resultsContainer);
  renderTimeline(plan.timeline, resultsContainer, eventName);
  renderVendors(plan.vendors, resultsContainer, plan.id);
  renderIdeas(plan.ideas, resultsContainer);

  // 8. Focus management: shift focus to results heading
  h2.focus();
}
