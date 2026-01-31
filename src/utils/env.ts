import { config as loadDotenv } from 'dotenv';

let loaded = false;

/**
 * Load .env from cwd. Call once at app entry (e.g. cli.ts).
 * Safe to call multiple times; only runs once.
 */
export function loadEnv(): void {
  if (loaded) return;
  loadDotenv();
  loaded = true;
}

export function getMOLTBOOK_API_KEY(): string {
  loadEnv();
  return process.env.MOLTBOOK_API_KEY ?? '';
}

export function getMCP_LOGGER(): boolean {
  loadEnv();
  return !!process.env.MCP_LOGGER;
}

export function getAppVersion(): string {
  loadEnv();
  return process.env.npm_package_version ?? '1.0.0';
}
