/**
 * @fileoverview Shared DOM creation helper for safe element rendering without innerHTML.
 */

/**
 * Creates an element with optional class name and text content.
 *
 * @param {string} tag
 * @param {string} [className='']
 * @param {string} [text='']
 * @returns {HTMLElement}
 */
export function el(tag, className = '', text = '') {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text) {
    element.textContent = text;
  }
  return element;
}
