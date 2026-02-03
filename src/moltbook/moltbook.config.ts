import { getMoltbookApiKey } from '../utils/env.js';

const BASE = 'https://www.moltbook.com/api/v1';

export function getMoltbookBase(): string {
  return BASE;
}

export function getApiKey(): string {
  const key = getMoltbookApiKey();
  if (!key) throw new Error('MOLTBOOK_API_KEY is not set');
  return key;
}
