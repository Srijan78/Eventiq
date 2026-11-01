// @ts-check
/**
 * @fileoverview Google Gemini AI integration with bounded retries, timeouts, and Zod schema validation.
 */

import { GoogleGenAI } from '@google/genai';
import { CONSTANTS } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import { buildBudgetIdeasPrompt, budgetIdeasResponseSchema } from '../prompts/budgetIdeasPrompt.js';
import { buildTimelinePrompt, timelineTasksResponseSchema } from '../prompts/timelinePrompt.js';
import { buildVendorPrompt, vendorGuidanceResponseSchema } from '../prompts/vendorPrompt.js';

/**
 * Executes an async operation with timeout and exponential backoff retry.
 *
 * @template T
 * @param {() => Promise<T>} task
 * @param {string} taskName
 * @param {number} [maxRetries=CONSTANTS.GEMINI.MAX_RETRIES]
 * @param {number} [timeoutMs=CONSTANTS.GEMINI.TIMEOUT_MS]
 * @returns {Promise<T>}
 */
function raceWithTimeout(task, taskName, timeoutMs) {
  const timeoutPromise = new Promise((_, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation "${taskName}" timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    timer.unref?.();
  });
  return Promise.race([task(), timeoutPromise]);
}

async function executeWithRetry(
  task,
  taskName,
  maxRetries = CONSTANTS.GEMINI.MAX_RETRIES,
  timeoutMs = CONSTANTS.GEMINI.TIMEOUT_MS,
) {
  let attempt = 0;
  let delay = CONSTANTS.GEMINI.INITIAL_RETRY_DELAY_MS;

  while (attempt <= maxRetries) {
    try {
      return await raceWithTimeout(task, taskName, timeoutMs);
    } catch (err) {
      attempt++;
      if (attempt > maxRetries) {
        logger.error(
          { taskName, attempts: attempt, err: err.message },
          'Gemini task failed after max retries',
        );
        throw err;
      }
      logger.warn(
        { taskName, attempt, nextRetryDelayMs: delay, err: err.message },
        'Gemini task attempt failed, retrying with backoff',
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  throw new Error(`Exhausted retries for ${taskName}`);
}

/**
 * Parses model raw output as JSON and validates against Zod schema.
 *
 * @param {string} rawText
 * @param {import('zod').ZodType} schema
 * @param {string} callName
 * @returns {any}
 */
function parseAndValidateModelOutput(rawText, schema, callName) {
  let parsedJson;
  try {
    parsedJson = JSON.parse(rawText || '');
  } catch (parseErr) {
    throw new Error(
      `Gemini returned invalid non-JSON output for ${callName}: ${parseErr.message}`,
      { cause: parseErr },
    );
  }
  return schema.parse(parsedJson);
}

/**
 * Executes a structured Gemini call with timeout and retries.
 *
 * @param {{ ai: GoogleGenAI, modelName: string, promptData: object, schema: import('zod').ZodType, callName: string }} options
 * @returns {Promise<any>}
 */
async function executeStructuredCall({ ai, modelName, promptData, schema, callName }) {
  return executeWithRetry(async () => {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: promptData.prompt,
      config: {
        systemInstruction: promptData.systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    return parseAndValidateModelOutput(response.text || '', schema, callName);
  }, callName);
}

/**
 * Creates an instance of the Gemini AI Service.
 *
 * @param {string} apiKey - Gemini API Key
 * @param {string} [modelName=CONSTANTS.GEMINI.DEFAULT_MODEL]
 * @returns {{ generateContent: (engineResult: object, req: object) => Promise<object> }}
 */
async function dispatchParallelGeminiCalls(ai, modelName, engineResult, req) {
  const [budgetIdeasResult, timelineResult, vendorResult] = await Promise.all([
    executeStructuredCall({
      ai,
      modelName,
      promptData: buildBudgetIdeasPrompt(engineResult, req),
      schema: budgetIdeasResponseSchema,
      callName: 'BudgetIdeasCall',
    }),
    executeStructuredCall({
      ai,
      modelName,
      promptData: buildTimelinePrompt(engineResult, req),
      schema: timelineTasksResponseSchema,
      callName: 'TimelineTasksCall',
    }),
    executeStructuredCall({
      ai,
      modelName,
      promptData: buildVendorPrompt(engineResult, req),
      schema: vendorGuidanceResponseSchema,
      callName: 'VendorGuidanceCall',
    }),
  ]);

  return {
    categories: budgetIdeasResult.categories,
    ideas: budgetIdeasResult.ideas,
    timelineTasks: timelineResult.timelineTasks,
    vendorGuidance: vendorResult.vendorGuidance,
  };
}

/**
 * Creates an instance of the Gemini AI Service.
 *
 * @param {string} apiKey - Gemini API Key
 * @param {string} [modelName=CONSTANTS.GEMINI.DEFAULT_MODEL]
 * @returns {{ generateContent: (engineResult: object, req: object) => Promise<object> }}
 */
export function createGeminiService(apiKey, modelName = CONSTANTS.GEMINI.DEFAULT_MODEL) {
  const ai = new GoogleGenAI({ apiKey });
  return Object.freeze({
    async generateContent(engineResult, req) {
      logger.info({ model: modelName }, 'Initiating 3 parallel Gemini calls');
      return dispatchParallelGeminiCalls(ai, modelName, engineResult, req);
    },
  });
}
