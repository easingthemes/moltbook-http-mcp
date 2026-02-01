#!/usr/bin/env node

import { loadEnv } from './utils/env.js';
loadEnv();

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { startServer, startStdioServer } from './index.js';
import { CliParams } from './types.js';

type CliArgs = CliParams & {
  help?: boolean;
  stdio?: boolean;
};

const argv = yargs(hideBin(process.argv)).options({
  mcpPort: { type: 'number', default: 3003, alias: 'm', describe: 'Port for MCP HTTP server' },
  stdio: { type: 'boolean', default: false, describe: 'Run MCP over stdin/stdout (for Cursor moltcli / subprocess)' },
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
  startServer({ mcpPort: argv.mcpPort });
}
