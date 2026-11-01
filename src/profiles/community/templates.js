// @ts-check
/**
 * @fileoverview Community gathering text rationales, category tips, vendor questions, and ideas.
 */

export const promptContext =
  'A high-participation community gathering prioritizing civic order, crowd safety, volunteer coordination, cost stewardship, and inclusive social spirit.';

export const templates = Object.freeze({
  summary:
    'A disciplined, community-centric event blueprint ensuring safety, engaging activities, and robust volunteer leadership.',
  rationales: Object.freeze({
    venue: 'Accessible public space or hall with adequate transit, restrooms, and parking.',
    catering:
      'Simple, inclusive refreshments and widespread hydration points for community comfort.',
    decor: 'Functional signage, welcoming banners, and clear stage branding.',
    sound:
      'Professional sound reinforcement ensuring all announcements and performances reach the crowd cleanly.',
    safety:
      'Paramedic readiness, first aid station, certified security guards, and emergency crowd management.',
    volunteers:
      'The core operational engine: badges, snacks, orientation materials, and communication radios.',
    publicity: 'Grassroots community outreach, printed flyers, and localized social announcements.',
    contingency:
      'Buffer for unforeseen municipal fees, extension permits, or extra clean-up charges.',
  }),
  categoryTips: Object.freeze({
    venue: [
      'Inspect restroom facilities and ensure water supply is steady.',
      'Ensure wheelchair accessibility ramps are clear.',
    ],
    catering: [
      'Opt for eco-friendly paper cups or bring-your-own-bottle water refill stations.',
      'Distribute packaged light snacks that create minimal trash.',
    ],
    decor: [
      'Hang weather-resistant vinyl banners high above head height.',
      'Place large high-contrast directional arrow signboards.',
    ],
    sound: [
      'Conduct sound check 2 hours prior to start.',
      'Have 2 backup wired microphones in case of wireless RF interference.',
    ],
    safety: [
      'Keep a fully stocked commercial first aid kit at the registration table.',
      'Locate 2 dry-chemical fire extinguishers near stage electrics.',
    ],
    volunteers: [
      'Conduct a mandatory 15-minute morning briefing before gates open.',
      'Provide vibrant identifiable high-visibility badges.',
    ],
    publicity: [
      'Distribute flyers in nearby community centres and residential lobbies.',
      'Post event schedules on local neighborhood groups.',
    ],
    contingency: [
      'Retain reserve funds for day-of trash removal labor.',
      'Do not disburse final vendor payments before site clearance.',
    ],
  }),
  vendorQuestions: Object.freeze({
    venue: [
      'What are the noise level curfews and electricity load limitations?',
      'Who handles municipal sanitation after the event?',
    ],
    sound: [
      'Do you supply an on-site audio sound technician throughout the event?',
      'Is a backup diesel generator included for the AV setup?',
    ],
    catering: [
      'Can you provide sealed water dispensers with continuous refilling?',
      'Are snacks packaged for rapid queue movement?',
    ],
    safety: [
      'Are your security personnel trained in crowd evacuation and basic first aid?',
      'Do you provide perimeter control stanchions?',
    ],
    volunteers: [
      'Can badges and orientation packets be printed 48 hours prior?',
      'Are walkie-talkies compatible with venue frequencies?',
    ],
    decor: [
      'Are banners printed on durable outdoor weatherproof material?',
      'Can directional stands withstand windy conditions?',
    ],
    publicity: [
      'What is the turnaround time for printing 500 promotional flyers?',
      'Can digital social assets be delivered in multiple aspect ratios?',
    ],
  }),
  vendorRedFlags: Object.freeze({
    venue: [
      'No clear point of contact on event morning.',
      'Locked emergency exits during operational hours.',
    ],
    sound: [
      'Faulty grounding wires causing hum or electrical shock hazard.',
      'Unwillingness to comply with permissible decibel limits.',
    ],
    catering: [
      'Uncovered open food standing in direct sun.',
      'Shortage of drinking water for attendees.',
    ],
    safety: [
      'Security staff leaving designated exit posts unattended.',
      'Expired fire safety canisters.',
    ],
    volunteers: [
      'Failure to conduct check-in briefing resulting in uncoordinated chaos.',
      'Lack of emergency escalation contact tree.',
    ],
    decor: [
      'Banners poorly anchored, blowing down into walkways.',
      'Obstructing mandatory venue safety signage.',
    ],
    publicity: [
      'Inaccurate dates or venue addresses on distributed print materials.',
      'Unauthorized fly-posting on private walls.',
    ],
  }),
  ideas: Object.freeze({
    themes: [
      'Neighborhood Green Earth Fair',
      'Heritage Cultural Mela & Artisan Bazaar',
      'Community Wellness & Sports Day',
    ],
    activities: [
      'Citizen Open Mic & Folk Arts Stage',
      'Interactive Tree-Planting Drive',
      'Youth Skill Exhibition & Robotics Showcase',
    ],
    menu: [
      'Community Chai & Healthy Millet Snacks',
      'Fresh Coconut Water & Citrus Coolers',
      'Locally Baked Buns & Vegetarian Cutlets',
    ],
    decor: [
      'Eco-Friendly Jute Bunting Flags',
      'Chalk Art Chalkboards for Community Messages',
      'Potted Plant Stage Podium Greenery',
    ],
    extras: [
      'Community Swap-A-Book Table',
      'Civic Feedback & Suggestion Drop Box',
      'Free Blood Pressure & Wellness Checkup Tent',
    ],
  }),
});
