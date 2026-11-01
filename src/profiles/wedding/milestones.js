// @ts-check
/**
 * @fileoverview Wedding timeline milestones.
 */

export const timelineMilestones = Object.freeze([
  { id: 'm-venue-date', label: 'Lock Date & Venue', weeksBefore: 24 },
  { id: 'm-photo-caterer', label: 'Book Photographer & Caterer', weeksBefore: 16 },
  { id: 'm-attire-decor', label: 'Finalize Decor & Wedding Attire', weeksBefore: 12 },
  { id: 'm-invites-makeup', label: 'Send Invitations & Book Makeup Artist', weeksBefore: 8 },
  { id: 'm-tastings-fittings', label: 'Menu Tastings & Attire Fittings', weeksBefore: 4 },
  {
    id: 'm-logistics-runsheet',
    label: 'Logistics, Rehearsal & Vendor Confirmation',
    weeksBefore: 2,
  },
  { id: 'm-final-prep', label: 'Final Headcount & Emergency Kit', weeksBefore: 1 },
  { id: 'm-day-of', label: 'Wedding Day Coordination', weeksBefore: 0 },
]);
