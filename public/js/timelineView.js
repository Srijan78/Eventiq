/**
 * @fileoverview Timeline section renderer for milestones and Google Calendar links.
 */

import { el } from './domUtils.js';

/**
 * Builds Google Calendar web URL from milestone and event name.
 *
 * @param {object} milestone
 * @param {string} eventName
 * @returns {string}
 */
export function buildGCalUrl(milestone, eventName) {
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
 * Creates a single milestone card element.
 *
 * @param {object} m - Milestone item
 * @param {string} eventName - Event name
 * @returns {HTMLElement} Card element
 */
function createMilestoneCard(m, eventName) {
  const card = el('div', `timeline-card ${m.urgent ? 'is-urgent' : ''}`);
  const header = el('div', 'timeline-card-header');
  const titleBox = el('div');
  titleBox.appendChild(el('h3', 'milestone-title', m.label));
  titleBox.appendChild(
    el(
      'span',
      'milestone-due-date',
      `Due Date: ${m.dueDate} (${m.weeksLeft === 0 ? 'Today / Immediate' : `${m.weeksLeft} week${m.weeksLeft > 1 ? 's' : ''} left`})`,
    ),
  );
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
  return card;
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
    list.appendChild(createMilestoneCard(m, eventName));
  }
  section.appendChild(list);
  container.appendChild(section);
}
