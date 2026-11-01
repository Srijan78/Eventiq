/**
 * @fileoverview Zod schema validation middleware factory.
 */

/**
 * Creates an Express middleware to validate request body against a Zod schema.
 *
 * @param {import('zod').ZodSchema} schema - Zod schema to parse against
 * @returns {import('express').RequestHandler}
 */
export function validate(schema) {
  return (req, _res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}
