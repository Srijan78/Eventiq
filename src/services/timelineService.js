// @ts-check
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
 * Resolves custom or default tasks for a milestone.
 *
 * @param {string} milestoneId
 * @param {string} milestoneLabel
 * @param {Array<{ milestoneId: string, title: string, detail: string }>} extraTasks
 * @returns {Array<{ title: string, detail: string }>}
 */
function resolveMilestoneTasks(milestoneId, milestoneLabel, extraTasks) {
  const assigned = extraTasks
    .filter((t) => t.milestoneId === milestoneId)
    .map((t) => ({ title: t.title, detail: t.detail }));

  if (assigned.length === 0) {
    assigned.push({
      title: `Execute: ${milestoneLabel}`,
      detail: `Review requirements and confirm vendor/logistical commitments for "${milestoneLabel}".`,
    });
  }
  return assigned;
}

/**
 * Merges milestones falling on the exact same calendar due date.
 *
 * @param {Array<{ id: string, label: string, dueDate: string, weeksLeft: number, urgent: boolean, tasks: Array<{ title: string, detail: string }> }>} milestones
 * @returns {Array<{ id: string, label: string, dueDate: string, weeksLeft: number, urgent: boolean, tasks: Array<{ title: string, detail: string }> }>}
 */
function mergeDuplicateDates(milestones) {
  const dateMap = new Map();

  for (const item of milestones) {
    if (dateMap.has(item.dueDate)) {
      const existing = dateMap.get(item.dueDate);
      existing.label = `${existing.label} & ${item.label}`;
      existing.urgent = existing.urgent || item.urgent;
      existing.tasks.push(...item.tasks);
    } else {
      dateMap.set(item.dueDate, { ...item, tasks: [...item.tasks] });
    }
  }

  return Array.from(dateMap.values());
}

/**
 * Partitions milestones into past-due tasks and scheduled future milestones.
 *
 * @param {Array<object>} profileMilestones
 * @param {Date} eventDate
 * @param {Date} today
 * @param {Array<object>} extraTasks
 * @returns {{ pastDueTasks: Array<object>, futureMilestones: Array<object> }}
 */
function partitionMilestones(profileMilestones, eventDate, today, extraTasks) {
  const pastDueTasks = [];
  const futureMilestones = [];

  for (const m of profileMilestones) {
    const dueDate = new Date(eventDate);
    dueDate.setDate(
      dueDate.getDate() - Math.round(m.weeksBefore * CONSTANTS.TIMELINE.DAYS_PER_WEEK),
    );
    const tasks = resolveMilestoneTasks(m.id, m.label, extraTasks);

    if (dueDate < today) {
      pastDueTasks.push(...tasks);
    } else {
      const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const weeksLeft = Math.max(0, Math.ceil(daysDiff / CONSTANTS.TIMELINE.DAYS_PER_WEEK));
      futureMilestones.push({
        id: m.id,
        label: m.label,
        dueDate: formatDate(dueDate),
        weeksLeft,
        urgent: weeksLeft <= CONSTANTS.TIMELINE.URGENT_WEEKS,
        tasks,
      });
    }
  }

  return { pastDueTasks, futureMilestones };
}

/**
 * Builds the event timeline from profile milestones and target event date.
 * Target: under 40 lines.
 *
 * @param {Array<{ id: string, label: string, weeksBefore: number }>} profileMilestones
 * @param {string} eventDateStr - Target event date in YYYY-MM-DD format
 * @param {Date} [todayDate=new Date()] - Reference today date
 * @param {Array<{ milestoneId: string, title: string, detail: string }>} [extraTasks=[]] - Injected tasks
 * @returns {Array<{ id: string, label: string, dueDate: string, weeksLeft: number, urgent: boolean, tasks: Array<{ title: string, detail: string }> }>}
 */
export function buildTimeline(
  profileMilestones,
  eventDateStr,
  todayDate = new Date(),
  extraTasks = [],
) {
  const today = toMidnight(todayDate);
  const eventDate = toMidnight(eventDateStr);
  const { pastDueTasks, futureMilestones } = partitionMilestones(
    profileMilestones,
    eventDate,
    today,
    extraTasks,
  );

  const result = [];
  if (pastDueTasks.length > 0) {
    result.push({
      id: 'm-do-now',
      label: 'Do Now: Immediate Catch-Up Actions',
      dueDate: formatDate(today),
      weeksLeft: 0,
      urgent: true,
      tasks: pastDueTasks,
    });
  }

  const merged = mergeDuplicateDates(futureMilestones);
  merged.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  result.push(...merged);

  return result;
}
