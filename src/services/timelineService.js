/**
 * @fileoverview Pure timeline date math, milestone collapse, and schedule generation.
 */

import { CONSTANTS } from '../config/constants.js';

/**
 * Normalizes a date instance to midnight UTC/local.
 * @param {Date|string} dateInput
 * @returns {Date}
 */
function toMidnight(dateInput) {
  const d = new Date(dateInput);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Formats a Date object to YYYY-MM-DD.
 * @param {Date} date
 * @returns {string}
 */
export function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Builds the event timeline from profile milestones and target event date.
 * Collapses past due milestones into a consolidated "Do now" group dated today.
 * Merges duplicate dates and sorts chronologically.
 *
 * @param {Array<{ id: string, label: string, weeksBefore: number }>} profileMilestones
 * @param {string} eventDateStr - Target event date in YYYY-MM-DD format
 * @param {Date} [todayDate=new Date()] - Reference today date
 * @param {Array<{ milestoneId: string, title: string, detail: string }>} [extraTasks=[]] - Injected tasks
 * @returns {Array<{ id: string, label: string, dueDate: string, weeksLeft: number, urgent: boolean, tasks: Array<{ title: string, detail: string }> }>}
 */
export function buildTimeline(profileMilestones, eventDateStr, todayDate = new Date(), extraTasks = []) {
  const today = toMidnight(todayDate);
  const eventDate = toMidnight(eventDateStr);
  const todayStr = formatDate(today);

  const pastDueTasks = [];
  const futureMilestones = [];

  for (const m of profileMilestones) {
    const dueDate = new Date(eventDate);
    const daysOffset = Math.round(m.weeksBefore * CONSTANTS.TIMELINE.DAYS_PER_WEEK);
    dueDate.setDate(dueDate.getDate() - daysOffset);

    // Collect custom tasks for this milestone
    const assignedTasks = extraTasks
      .filter((t) => t.milestoneId === m.id)
      .map((t) => ({ title: t.title, detail: t.detail }));

    // Default primary task if no custom tasks attached
    if (assignedTasks.length === 0) {
      assignedTasks.push({
        title: `Execute: ${m.label}`,
        detail: `Review requirements and confirm vendor/logistical commitments for "${m.label}".`,
      });
    }

    if (dueDate < today) {
      // Past milestone collapses into "Do now"
      for (const t of assignedTasks) {
        pastDueTasks.push(t);
      }
    } else {
      const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const weeksLeft = Math.max(0, Math.ceil(daysDiff / CONSTANTS.TIMELINE.DAYS_PER_WEEK));
      const urgent = weeksLeft <= CONSTANTS.TIMELINE.URGENT_WEEKS;

      futureMilestones.push({
        id: m.id,
        label: m.label,
        dueDate: formatDate(dueDate),
        weeksLeft,
        urgent,
        tasks: assignedTasks,
      });
    }
  }

  const result = [];

  // If there are past-due tasks, create the consolidated "Do Now" milestone
  if (pastDueTasks.length > 0) {
    result.push({
      id: 'm-do-now',
      label: 'Do Now: Immediate Catch-Up Actions',
      dueDate: todayStr,
      weeksLeft: 0,
      urgent: true,
      tasks: pastDueTasks,
    });
  }

  // Merge milestones sharing the exact same due date
  const dateMap = new Map();
  for (const item of futureMilestones) {
    if (dateMap.has(item.dueDate)) {
      const existing = dateMap.get(item.dueDate);
      existing.label = `${existing.label} & ${item.label}`;
      existing.urgent = existing.urgent || item.urgent;
      existing.tasks.push(...item.tasks);
    } else {
      dateMap.set(item.dueDate, { ...item, tasks: [...item.tasks] });
    }
  }

  for (const item of dateMap.values()) {
    result.push(item);
  }

  // Sort ascending by date
  result.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return result;
}
