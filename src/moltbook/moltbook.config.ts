import { getMOLTBOOK_API_KEY } from '../utils/env.js';

const BASE = 'https://www.moltbook.com/api/v1';

export function getMoltbookBase(): string {
  return BASE;
}

export function getApiKey(): string {
  const key = getMOLTBOOK_API_KEY();
  if (!key) throw new Error('MOLTBOOK_API_KEY is not set');
  return key;
}
