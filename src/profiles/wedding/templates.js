// @ts-check
/**
 * @fileoverview Wedding text rationales, category tips, vendor questions, and ideas.
 */

export const promptContext =
  'A traditional yet modern wedding requiring harmonious rituals, guest hospitality, emotional resonance, and precise multi-day timing.';

export const templates = Object.freeze({
  summary:
    'A comprehensive, memorable wedding plan balancing grand celebrations with realistic budget discipline.',
  rationales: Object.freeze({
    venue: 'The venue anchors the ambiance, guest flow, and ceremonial dignity of the wedding.',
    catering: 'Catering accounts for the largest guest touchpoint and reflects your hospitality.',
    decor: 'Sets the visual theme and floral atmosphere across all key ceremonies.',
    photography: 'Preserves heirloom memories and wedding milestones for a lifetime.',
    attire: 'Outfits and styling for the bride, groom, and immediate wedding party.',
    entertainment: 'DJs, traditional musicians, and sound systems keeping energy vibrant.',
    makeup: 'Professional bridal makeup and styling for extended photo durability.',
    logistics: 'Seamless guest transportation, room allocations, and luggage assistance.',
    contingency: 'Crucial reserve for last-minute headcounts, overtime fees, or tips.',
  }),
  categoryTips: Object.freeze({
    venue: [
      'Verify generator power backup coverage.',
      'Clarify curfew rules for outdoor amplified music.',
    ],
    catering: [
      'Book a formal tasting 4 weeks before.',
      'Confirm exact plate count audit protocol.',
    ],
    decor: [
      'Choose seasonal local flowers to reduce waste and cost.',
      'Re-use stage floral arrangements for reception.',
    ],
    photography: [
      'Share a detailed shot list of VIP family members.',
      'Confirm delivery date for raw high-res photos.',
    ],
    attire: [
      'Schedule the final fitting 10 days before the wedding.',
      'Keep a compact bridal emergency sewing kit.',
    ],
    entertainment: [
      'Provide a "do-not-play" list to the DJ.',
      'Confirm microphone wireless range for mandap vows.',
    ],
    makeup: [
      'Book a hair and makeup trial with your ceremony veil.',
      'Request waterproof, long-wear cosmetic formulations.',
    ],
    logistics: [
      'Create a designated WhatsApp broadcast group for guests.',
      'Assign a dedicated hospitality captain.',
    ],
    contingency: [
      'Keep ₹10,000 in crisp petty cash for day-of emergency vendor tips.',
      'Never spend contingency before the wedding week.',
    ],
  }),
  vendorQuestions: Object.freeze({
    venue: [
      'What are the overtime fees per hour past midnight?',
      'Are outside sound and decor vendors permitted without royalty fees?',
    ],
    catering: [
      'What is the server-to-guest ratio on the floor?',
      'How is unconsumed packaged food handed over at closing?',
    ],
    photography: [
      'Will you personally shoot the wedding, or send associate shooters?',
      'What is your turnaround time for the highlight film?',
    ],
    decor: [
      'Is rigging and truss structure included in the quote?',
      'Do you handle teardown immediately post-event?',
    ],
    attire: [
      'How many alterations are covered in the purchase price?',
      'What is the expedited delivery policy?',
    ],
    makeup: [
      'Does the quote include touch-ups between rituals?',
      'Do you provide false lashes and hairstyling hairpieces?',
    ],
    entertainment: [
      'Do you possess necessary regional music performance licenses?',
      'What backup sound gear do you carry onsite?',
    ],
    logistics: [
      'Are fuel and toll taxes included in vehicle day rates?',
      'What is the vehicle standby protocol during ceremonies?',
    ],
  }),
  vendorRedFlags: Object.freeze({
    venue: [
      'Refusing to provide emergency power backup in writing.',
      'Vague refund policies regarding unforeseen venue damages.',
    ],
    catering: [
      'Unwillingness to accommodate hygienic kitchen visits.',
      'Extra hidden charges for basic cutlery and water service.',
    ],
    photography: [
      'No physical backup camera gear during the event.',
      'Over 6 months turnaround for photo delivery.',
    ],
    decor: [
      'Substituting promised exotic flowers with cheap artificial greenery without prior consent.',
      'Poor electrical safety on stage lighting cables.',
    ],
    attire: [
      'No written promised delivery date on tailoring bill.',
      'Unwilling to allow a fitting before final payment.',
    ],
    makeup: [
      'Using unbranded or unhygienic shared cosmetic applicators.',
      'Unpunctual arrival during trial.',
    ],
    entertainment: [
      'Playing prohibited explicit music at family ceremonies.',
      'No secondary audio console in case of mixer burnout.',
    ],
    logistics: ['Unlicensed commercial drivers.', 'Vehicles lacking functioning air conditioning.'],
  }),
  ideas: Object.freeze({
    themes: [
      'Royal Heritage with Marigold Accents',
      'Minimalist Pastel Garden Soirée',
      'Regal Velvet & Candlelit Twilight',
    ],
    activities: [
      'Live Shehnai & Sitar Welcome',
      'Interactive Polaroid Guestbook Wall',
      'Sangeet Flashmob Coordination',
    ],
    menu: [
      'Live Artisanal Chaat Counter',
      'Signature Regional Biryani Handi',
      'Kulfi & Warm Jalebi Tasting Bar',
    ],
    decor: [
      'Brass Diya Chandelier Installations',
      'Fairy Light Canopy over Dining Courtyard',
      'Custom Calligraphy Welcome Signage',
    ],
    extras: [
      'Curated Welcome Snack Hampers in Guest Rooms',
      'Personalized Embroidered Stoles for Baaraat',
      'Morning Herbal Tea Bar for Elders',
    ],
  }),
});
