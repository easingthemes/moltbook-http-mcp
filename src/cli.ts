#!/usr/bin/env node

import { loadEnv } from './utils/env.js';
loadEnv();

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { startServer, startStdioServer } from './index.js';
import { CliParams } from './types.js';
import { getMCP_HTTPS_CERT_PATH, getMCP_HTTPS_KEY_PATH } from './utils/env.js';

type CliArgs = CliParams & {
  help?: boolean;
  stdio?: boolean;
  port?: number;
  key?: string;
  cert?: string;
};

const argv = yargs(hideBin(process.argv)).options({
  port: { type: 'number', default: 3003, alias: 'p', describe: 'Port for MCP HTTP server' },
  stdio: { type: 'boolean', default: false, describe: 'Run MCP over stdin/stdout (for Cursor moltcli / subprocess)' },
  auth: { type: 'boolean', default: false, describe: 'Require JWT auth on POST /mcp' },
  key: { type: 'string', describe: 'Path to TLS private key PEM (enables HTTPS with --cert)' },
  cert: { type: 'string', describe: 'Path to TLS certificate PEM (enables HTTPS with --key)' },
})
  .help()
  .alias('h', 'help')
  .parseSync() as CliArgs;

if (argv.help) {
  process.exit(0);
}

const useStdio = argv.stdio || !process.stdin.isTTY;

if (useStdio) {
  startStdioServer({}).catch((err) => {
    console.error('MCP stdio server error:', err);
    process.exit(1);
  });
} else {
  const keyPath = (argv.key ?? getMCP_HTTPS_KEY_PATH()) || undefined;
  const certPath = (argv.cert ?? getMCP_HTTPS_CERT_PATH()) || undefined;
  startServer({
    mcpPort: argv.port,
    auth: argv.auth,
    keyPath: keyPath || undefined,
    certPath: certPath || undefined,
  });
}
