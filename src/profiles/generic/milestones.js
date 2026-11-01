// @ts-check
/**
 * @fileoverview Generic / Custom event timeline milestones.
 */

export const timelineMilestones = Object.freeze([
  { id: 'm-concept-venue', label: 'Define Event Objectives & Secure Venue', weeksBefore: 12 },
  {
    id: 'm-budget-vendors',
    label: 'Finalize Vendor Contracts (Caterer & AV/Entertainment)',
    weeksBefore: 8,
  },
  {
    id: 'm-invites-agenda',
    label: 'Issue Invitations & Confirm Run-of-Show Agenda',
    weeksBefore: 4,
  },
  { id: 'm-logistics-headcount', label: 'Lock RSVPs, Seating & Logistics Setup', weeksBefore: 2 },
  { id: 'm-final-checks', label: 'Final Vendor Confirmation & Materials Check', weeksBefore: 1 },
  { id: 'm-event-day', label: 'Event Execution & Onsite Coordination', weeksBefore: 0 },
]);
