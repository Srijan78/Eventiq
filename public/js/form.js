/**
 * @fileoverview Form validation, dynamic field switching, and payload extraction strategy.
 */

export {
  updateDynamicFields,
  extractProfileSpecificData,
  populateProfileFields,
} from './formProfileFields.js';

export {
  setFieldError,
  clearFieldError,
  clearAllErrors,
  validateClientForm,
} from './formValidation.js';

export { extractFormData, populateForm } from './formBuilder.js';
