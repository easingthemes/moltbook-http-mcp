import { NextFunction, Request, RequestHandler, Response } from 'express';
import { jwtVerify, createRemoteJWKSet } from 'jose';
import { getAppApiKey, getAppDomain } from '../utils/env.js';
import { CliParams } from '../types.js';

/**
 * API Key authentication for MCP routes.
 * Accepts Authorization: Bearer <key> or X-API-Key: <key>.
 * If MOLTBOOK_API_KEY is set, the request key must match.
 * If not set, no auth is required (useful for local dev).
 */
export const apiKeyAuth = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = getAppApiKey();
  if (!apiKey) {
    next();
    return;
  }
  const authHeader = req.headers.authorization;
  const apiKeyHeader = req.headers['x-api-key'];
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (apiKeyHeader as string) ?? '';
  if (!token || token !== apiKey) {
    res.status(401).json({ error: 'Invalid or missing API key. Use Authorization: Bearer <key> or X-API-Key: <key>.' });
    return;
  }
  next();
};

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks(): ReturnType<typeof createRemoteJWKSet> | null {
  const domain = getAppDomain();
  if (!domain) return null;
  if (!jwks) {
    const url = domain.startsWith('http') ? `${domain}/.well-known/jwks.json` : `https://${domain}/.well-known/jwks.json`;
    jwks = createRemoteJWKSet(new URL(url));
  }
  return jwks;
}

async function requireAuthMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const domain = getAppDomain();
  if (!domain) {
    res.status(503).json({ error: 'JWT auth not configured: APP_DOMAIN is not set' });
    return;
  }

  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).end();
    return;
  }

  const jwksClient = getJwks();
  if (!jwksClient) {
    res.status(503).json({ error: 'JWT auth not configured: APP_DOMAIN is not set' });
    return;
  }

  try {
    const token = header.slice(7);
    const { payload } = await jwtVerify(token, jwksClient, {
      issuer: domain,
      audience: 'mcp',
    });
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).end();
  }
}

/** Returns JWT auth middleware when params.auth is true, otherwise a no-op that calls next(). */
export function requireAuth(params: CliParams): RequestHandler {
  if (!params?.auth) {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }
  return requireAuthMiddleware as RequestHandler;
}
