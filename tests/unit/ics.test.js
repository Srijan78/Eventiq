import test from 'node:test';
import assert from 'node:assert/strict';
import { generateIcs, googleCalendarUrl } from '../../src/utils/ics.js';

test('generateIcs: formats valid RFC 5545 iCalendar data with escaped characters', () => {
  const timeline = [
    {
      label: 'Book Wedding Hall; Pay Deposit',
      dueDate: '2027-02-15',
      tasks: [{ title: 'Visit Venue', detail: 'Inspect acoustics, lighting & restrooms.' }],
    },
    {
      label: 'Finalize Menu, Tastings',
      dueDate: '2027-03-01',
      tasks: [],
    },
  ];

  const ics = generateIcs(timeline, 'Priya & Rahul Wedding');

  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n'));
  assert.ok(ics.endsWith('\r\nEND:VCALENDAR'));
  assert.ok(ics.includes('VERSION:2.0'));
  assert.ok(ics.includes('PRODID:-//Eventiq//GenAI Event Planner//EN'));

  // Dates formatted as YYYYMMDD
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20270215'));
  assert.ok(ics.includes('DTEND;VALUE=DATE:20270216'));

  // Escaping semicolons and commas in summary
  assert.ok(ics.includes('Book Wedding Hall\\; Pay Deposit'));
  assert.ok(ics.includes('Finalize Menu\\, Tastings'));
});

test('googleCalendarUrl: constructs valid URL with encoded parameters', () => {
  const milestone = {
    label: 'Lock Caterer',
    dueDate: '2027-04-10',
    tasks: [{ title: 'Sign Contract', detail: 'Verify vegetarian menu' }],
  };

  const url = googleCalendarUrl(milestone, 'Annual Gala');
  assert.ok(url.startsWith('https://calendar.google.com/calendar/render?action=TEMPLATE'));
  assert.ok(url.includes('dates=20270410/20270411'));
  assert.ok(url.includes('Annual%20Gala%3A%20Lock%20Caterer'));
  assert.ok(url.includes('Verify%20vegetarian%20menu'));
});
