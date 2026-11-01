/**
 * @fileoverview In-memory HTTP request dispatcher and test fixtures for offline zero-socket testing.
 */

import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';

/**
 * Returns an ISO date string (YYYY-MM-DD) for N days in the future.
 * @param {number} [daysAhead=60]
 * @returns {string}
 */
export function futureDate(daysAhead = 60) {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString().split('T')[0];
}

/**
 * Creates a valid, schema-compliant request payload for testing.
 * @param {'wedding'|'birthday'|'community'|'other'} [eventType='wedding']
 * @param {Record<string, any>} [overrides={}]
 * @returns {Record<string, any>}
 */
export function createValidRequest(eventType = 'wedding', overrides = {}) {
  const base = {
    eventType,
    eventDate: futureDate(60),
    guests: 120,
    budget: 300000,
    city: 'Bengaluru',
    costLevel: 'average',
    theme: 'Celebration',
    notes: 'Strict schedule required',
  };

  if (eventType === 'wedding') {
    base.wedding = { functions: ['wedding', 'reception'], indoor: true, dietary: 'Vegetarian' };
  } else if (eventType === 'birthday') {
    base.birthday = { ageGroup: 'kids', childAge: 7, homeParty: false };
  } else if (eventType === 'community') {
    base.community = { cause: 'Cultural Fest', outdoor: true, expectedTurnout: 150 };
  } else if (eventType === 'other') {
    base.eventName = 'Annual Product Hackathon';
  }

  return { ...base, ...overrides };
}

/**
 * Dispatches an HTTP request directly into an Express app in-memory.
 * Does not bind to any network port or loopback socket.
 *
 * @param {import('express').Express} app - Express app instance
 * @param {object} options
 * @param {string} [options.method='GET']
 * @param {string} [options.url='/']
 * @param {Record<string, string>} [options.headers={}]
 * @param {any} [options.body]
 * @returns {Promise<{ status: number, headers: Record<string, any>, text: () => Promise<string>, json: () => Promise<any> }>}
 */
export function dispatchRequest(app, options = {}) {
  return new Promise((resolve, reject) => {
    try {
      const socket = new Socket();
      const req = new IncomingMessage(socket);
      req.method = options.method || 'GET';
      req.url = options.url || '/';
      req.headers = { ...(options.headers || {}) };
      req.ip = '127.0.0.1';

      let bodyBuffer = null;
      if (options.body !== undefined && options.body !== null) {
        bodyBuffer = Buffer.from(
          typeof options.body === 'string' ? options.body : JSON.stringify(options.body),
        );
        req.headers['content-length'] = String(bodyBuffer.length);
        if (!req.headers['content-type']) {
          req.headers['content-type'] = 'application/json';
        }
      }

      const res = new ServerResponse(req);
      const chunks = [];

      res.write = (chunk) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        return true;
      };

      res.end = (chunk) => {
        if (chunk) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }

        const rawBody = Buffer.concat(chunks).toString('utf8');
        resolve({
          status: res.statusCode,
          headers: res.getHeaders(),
          text: () => Promise.resolve(rawBody),
          json: () => {
            try {
              return Promise.resolve(JSON.parse(rawBody));
            } catch {
              return Promise.reject(new Error(`Failed to parse response body as JSON: ${rawBody}`));
            }
          },
        });
      };

      app.handle(req, res);

      setImmediate(() => {
        if (bodyBuffer) {
          req.emit('data', bodyBuffer);
        }
        req.emit('end');
      });
    } catch (err) {
      reject(err);
    }
  });
}
