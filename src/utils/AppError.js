/**
 * @fileoverview Central application error class with structured status, code, and details.
 */

export class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} [status=500] - HTTP status code
   * @param {string} [code='INTERNAL_ERROR'] - Error code identifier
   * @param {Array<any>} [details=[]] - Optional structured error details
   */
  constructor(message, status = 500, code = 'INTERNAL_ERROR', details = []) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.details = details;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}
