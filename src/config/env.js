/**
 * @fileoverview Environment configuration loader and validator with Zod.
 */

import dotenv from 'dotenv';
import { z } from 'zod';
import { CONSTANTS } from './constants.js';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  GEMINI_API_KEY: z.string().trim().default(''),
  GEMINI_MODEL: z.string().trim().min(1).default(CONSTANTS.GEMINI.DEFAULT_MODEL),
  CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(CONSTANTS.CACHE.DEFAULT_TTL_SECONDS),
  CACHE_MAX_ENTRIES: z.coerce.number().int().positive().default(CONSTANTS.CACHE.DEFAULT_MAX_ENTRIES),
  RATE_LIMIT_PER_MIN: z.coerce.number().int().positive().default(CONSTANTS.RATE_LIMIT.DEFAULT_GENERAL_PER_MIN),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const formattedErrors = parsed.error.issues
    .map((issue) => ` - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n');
  throw new Error(`[Config Error] Invalid environment configuration:\n${formattedErrors}`);
}

/**
 * Validated, immutable environment configuration.
 * @type {Readonly<z.infer<typeof envSchema>>}
 */
export const ENV = Object.freeze(parsed.data);
