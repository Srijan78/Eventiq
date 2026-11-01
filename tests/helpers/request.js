/**
 * @fileoverview In-memory HTTP request dispatcher for offline zero-socket integration testing.
 */

import { IncomingMessage, ServerResponse } from 'node:http';
import { Socket } from 'node:net';

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

      if (bodyBuffer) {
        req.emit('data', bodyBuffer);
        req.emit('end');
      } else {
        req.emit('end');
      }
    } catch (err) {
      reject(err);
    }
  });
}
