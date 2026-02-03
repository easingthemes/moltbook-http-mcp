import { AsyncLocalStorage } from 'node:async_hooks';
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

/** Request-scoped API key for multi-tenant: each client sends their own MOLTBOOK_API_KEY. */
const requestApiKeyStorage = new AsyncLocalStorage<string | undefined>();

/**
 * Run a function with a request-scoped Moltbook API key (e.g. from Authorization header).
 * Used so multiple users can use the same MCP server with their own keys.
 */
export function runWithMoltbookApiKey<T>(apiKey: string | undefined, fn: () => T): T {
  return requestApiKeyStorage.run(apiKey, fn);
}

export function getAppApiKey(): string {
  loadEnv();
  return process.env.MCP_API_KEY ?? '';
}

/**
 * Moltbook API key: request-scoped (per client) first, then env MOLTBOOK_API_KEY.
 * Enables multi-tenant: clients send Authorization: Bearer <key> or X-API-Key: <key>.
 */
export function getMoltbookApiKey(): string {
  loadEnv();
  const requestKey = requestApiKeyStorage.getStore();
  if (requestKey !== undefined) return requestKey;
  return process.env.MOLTBOOK_API_KEY ?? '';
}

export function getMcpLogger(): boolean {
  loadEnv();
  return !!process.env.MCP_LOGGER;
}

export function getAppVersion(): string {
  loadEnv();
  return process.env.npm_package_version ?? '1.0.0';
}

/** Path to TLS private key PEM for HTTPS (e.g. localhost). */
export function getMCP_HTTPS_KEY_PATH(): string {
  loadEnv();
  return process.env.MCP_HTTPS_KEY_PATH ?? '';
}

/** Path to TLS certificate PEM for HTTPS (e.g. localhost). */
export function getMCP_HTTPS_CERT_PATH(): string {
  loadEnv();
  return process.env.MCP_HTTPS_CERT_PATH ?? '';
}

export function getAppDomain(): string {
  loadEnv();
  return process.env.APP_DOMAIN ?? '';
}
