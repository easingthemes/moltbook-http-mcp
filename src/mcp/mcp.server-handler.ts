import { randomUUID } from 'node:crypto';
import { Request, Response } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { transports } from './mcp.transports.js';
import { createMCPServer } from './mcp.server.js';
import { CliParams } from '../types.js';
import { getMoltbookApiKey, runWithMoltbookApiKey } from '../utils/env.js';
import { LOGGER } from '../utils/logger.js';

/** Per-session API keys so multi-tenant clients keep their key across requests. */
const sessionApiKeys: Record<string, string> = {};

function getApiKeyFromRequest(req: Request): string {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim();
  const x = req.headers['x-api-key'];
  if (typeof x === 'string') return x.trim();
  const q = req.query.apiKey;
  if (typeof q === 'string') return q.trim();
  return '';
}

export const handleRequest = async (req: Request, res: Response, cliParams: CliParams) => {
  LOGGER.log('1.Received MCP request:', req.body);
  const { jsonrpc, id, method } = req.body;
  if (jsonrpc !== '2.0' || !method) {
    res.status(400).json({
      jsonrpc: '2.0',
      id: id || null,
      error: { code: -32600, message: 'Invalid Request', data: 'Must be valid JSON-RPC 2.0' },
    });
    return;
  }

  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  const apiKeyFromHeaders = getApiKeyFromRequest(req);
  const apiKeyFromSession = sessionId ? sessionApiKeys[sessionId] : undefined;
  const apiKeyFromEnv = getMoltbookApiKey();
  const resolvedKey = apiKeyFromSession ?? (apiKeyFromHeaders || apiKeyFromEnv || '');

  if (!resolvedKey) {
    res.status(401).json({
      jsonrpc: '2.0',
      id: id ?? null,
      error: {
        code: -32001,
        message: 'Missing API key. Send Authorization: Bearer <key>, X-API-Key: <key>, or ?apiKey=<key> in the URL.',
      },
    });
    return;
  }

  await runWithMoltbookApiKey(resolvedKey, async () => {
    try {
      let transport: StreamableHTTPServerTransport;

      if (sessionId && transports[sessionId]) {
        LOGGER.log(`Session exists: ${sessionId}`);
        transport = transports[sessionId];
      } else if (!sessionId && isInitializeRequest(req.body)) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          enableJsonResponse: true,
          onsessioninitialized: (sid) => {
            LOGGER.log(`Session initialized with ID: ${sid}`);
            transports[sid] = transport;
            sessionApiKeys[sid] = resolvedKey;
          },
        });

        LOGGER.log('Connecting to MCP server with CLI params:', cliParams);
        const server = createMCPServer(cliParams);
        await server.connect(transport);
        await transport.handleRequest(req, res, req.body);
        return;
      } else {
        res.status(400).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Bad Request: No valid session ID provided',
          },
          id: null,
        });
        return;
      }

      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      LOGGER.error('Error handling MCP request:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        });
      }
    }
  });
};
