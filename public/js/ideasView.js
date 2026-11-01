/**
 * @fileoverview Ideas and concepts section renderer.
 */

import { el } from './domUtils.js';

/**
 * Appends an idea card block if items exist.
 *
 * @param {HTMLElement} grid - Target grid element
 * @param {string} title - Card header
 * @param {string[]} items - Array of idea strings
 */
function addIdeaBlock(grid, title, items) {
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
}

/**
 * Renders the personalized ideas & concept section.
 *
 * @param {object} ideas - Ideas collection
 * @param {HTMLElement} container - Results container
 */
export function renderIdeas(ideas, container) {
  const section = el('section', 'results-section');
  section.id = 'ideas';
  section.setAttribute('aria-labelledby', 'heading-ideas');

  const h2 = el('h2', 'section-heading', 'Personalized Ideas & Creative Concepts');
  h2.id = 'heading-ideas';
  section.appendChild(h2);

  const grid = el('div', 'ideas-grid');
  addIdeaBlock(grid, 'Themes & Aesthetics', ideas.themes);
  addIdeaBlock(grid, 'Engaging Activities & Entertainment', ideas.activities);
  addIdeaBlock(grid, 'Catering & Signature Menu Concepts', ideas.menu);
  addIdeaBlock(grid, 'Decor & Floral Highlights', ideas.decor);
  addIdeaBlock(grid, 'Special Touches & Guest Experience', ideas.extras);

  section.appendChild(grid);
  container.appendChild(section);
}
