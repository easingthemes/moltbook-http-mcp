import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { handleRequest } from '../mcp/mcp.server-handler.js';
import { createMCPServer } from '../mcp/mcp.server.js';
import { apiKeyAuth, requireAuth } from './app.auth.js';
import { CliParams } from '../types.js';
import { getMoltbookApiKey, getAppVersion } from '../utils/env.js';
import { LOGGER } from '../utils/logger.js';

/**
 * Starts the MCP server over stdio (stdin/stdout).
 * Use when the process is launched as a subprocess (e.g. Cursor "moltcli" with command "npx" args ["-y", "moltbook-http-mcp"]).
 * Do not write to stdout in this mode — it would corrupt the JSON-RPC stream.
 */
export const startStdioServer = async (params: CliParams = {}) => {
  const transport = new StdioServerTransport();
  const server = createMCPServer(params);
  await server.connect(transport);
  if (process.stderr.writable) {
    process.stderr.write('Moltbook MCP stdio server ready\n');
  }
};

const createServer = (params: CliParams = {}) => {
  const app = express();

  app.use(cors({
    origin: '*',
    exposedHeaders: ['Mcp-Session-Id']
  }));
  app.use(express.json());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const publicDir = path.join(__dirname, '..', '..', 'public');
  app.use(express.static(publicDir));

  app.get('/health', async (req: Request, res: Response) => {
    try {
      const apiKey = getMoltbookApiKey();
      let moltbook = 'disconnected';
      let auth = 'not authorized';
      if (apiKey) {
        try {
          const resFetch = await fetch('https://www.moltbook.com/api/v1/agents/status', {
            headers: { Authorization: `Bearer ${apiKey}` },
          });
          if (resFetch.ok) {
            moltbook = 'connected';
            auth = 'authorized';
          }
        } catch {
          // keep disconnected/not authorized
        }
      }
      const result = {
        status: 'healthy',
        moltbook,
        auth,
        mcp: 'ready',
        timestamp: new Date().toISOString(),
        version: getAppVersion() || '1.0.0',
      };
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() });
    }
  });

  app.post('/mcp', requireAuth(params), async (req: Request, res: Response) => {
    await handleRequest(req, res, params);
  });

  app.get('/mcp', async (req: Request, res: Response) => {
    res.status(405).set('Allow', 'POST').send('Method Not Allowed');
  });

  app.delete('/mcp', async (req: Request, res: Response) => {
    LOGGER.log('Received DELETE MCP request');
    res.writeHead(405).end(JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed."
      },
      id: null
    }));
  });

  app.get('/', (req: Request, res: Response) => {
    res.json({
      name: 'Moltbook MCP Gateway Server',
      description: 'MCP server for Moltbook: the social network for AI agents. Post, comment, upvote, DMs, communities.',
      version: getAppVersion() || '1.0.0',
      endpoints: {
        health: { method: 'GET', path: '/health', description: 'Health check for all services' },
        mcp: { method: 'POST', path: '/mcp', description: 'JSON-RPC endpoint for MCP calls' },
        wellKnownMcp: { method: 'GET', path: '/.well-known/mcp.json', description: 'MCP server manifest (tools list)' },
      },
      architecture: 'MCP integration',
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}

export const startServer = (params: CliParams = {}) => {
  const { mcpPort = 3003, keyPath, certPath } = params || {};
  const app = createServer(params);

  const onListen = (error?: Error) => {
    if (error) {
      LOGGER.error('Failed to start server:', error);
      process.exit(1);
    }
    const scheme = keyPath && certPath ? 'https' : 'http';
    LOGGER.log(`0. Moltbook MCP Server listening on ${scheme}://localhost:${mcpPort}`);
  };

  if (keyPath && certPath) {
    try {
      const key = fs.readFileSync(keyPath, 'utf8');
      const cert = fs.readFileSync(certPath, 'utf8');
      const server = https.createServer({ key, cert }, app);
      server.listen(mcpPort, () => onListen());
    } catch (err: any) {
      LOGGER.error('HTTPS: failed to read key or cert:', err?.message ?? err);
      process.exit(1);
    }
  } else {
    app.listen(mcpPort, onListen);
  }
};

process.on('SIGINT', async () => {
  LOGGER.log('Shutting down server...');
  process.exit(0);
});
