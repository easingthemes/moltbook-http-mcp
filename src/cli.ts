#!/usr/bin/env node

import { loadEnv } from './utils/env.js';
loadEnv();

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { startServer } from './index.js';
import { CliParams } from './types.js';

type CliArgs = CliParams & {
  help?: boolean;
};

const argv = yargs(hideBin(process.argv)).options({
  mcpPort: { type: 'number', default: 3003, alias: 'm', describe: 'Port for MCP HTTP server' },
})
  .help()
  .alias('h', 'help')
  .parseSync() as CliArgs;

if (argv.help) {
  process.exit(0);
}

startServer({ mcpPort: argv.mcpPort });
