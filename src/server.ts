import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * SECURITY WORKAROUND for CVEs in @angular/ssr
 * Sanitizes X-Forwarded-Prefix to prevent Open Redirect / SSRF
 */
app.use((req, res, next) => {
  let prefix = req.headers['x-forwarded-prefix'];
  if (Array.isArray(prefix)) prefix = prefix[0];

  if (prefix) {
    try {
      // Decode the prefix to catch encoded characters like %2e (dots)
      const decodedPrefix = decodeURIComponent(prefix);
      
      // Sanitize: remove traversal attempts and ensure a safe leading slash
      req.headers['x-forwarded-prefix'] = decodedPrefix
        .replace(/\.\./g, '')       // Remove any dot-dot sequences
        .replace(/^[/\\]+/, '/');   // Ensure it starts with exactly one slash
    } catch (e) {
      // If decoding fails, remove the potentially malicious header entirely
      delete req.headers['x-forwarded-prefix'];
    }
  }
  next();
});

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 * // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);