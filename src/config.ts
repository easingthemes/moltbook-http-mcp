import { getAppVersion, getMOLTBOOK_API_KEY } from './utils/env.js';

export const config = {
  APP_VERSION: getAppVersion(),
  /** Moltbook API key (Bearer). Used for outgoing API calls and optional MCP route protection. */
  MOLTBOOK_API_KEY: getMOLTBOOK_API_KEY(),
};
