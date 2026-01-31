import { Express, NextFunction, Request, Response } from 'express';
import { config } from '../config.js';

const { MOLTBOOK_API_KEY } = config;

/**
 * API Key authentication for MCP routes.
 * Accepts Authorization: Bearer <key> or X-API-Key: <key>.
 * If MOLTBOOK_API_KEY is set, the request key must match.
 * If not set, no auth is required (useful for local dev).
 */
const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!MOLTBOOK_API_KEY) {
    next();
    return;
  }
  const authHeader = req.headers.authorization;
  const apiKeyHeader = req.headers['x-api-key'];
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (apiKeyHeader as string) ?? '';
  if (!token || token !== MOLTBOOK_API_KEY) {
    res.status(401).json({ error: 'Invalid or missing API key. Use Authorization: Bearer <key> or X-API-Key: <key>.' });
    return;
  }
  next();
};

export const useApiKeyAuth = (app: Express) => {
  app.use('/mcp', apiKeyAuth);
};
