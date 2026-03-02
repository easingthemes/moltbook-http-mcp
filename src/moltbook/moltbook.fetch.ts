import { getMoltbookBase, getApiKey } from './moltbook.config.js';

const DEFAULT_TIMEOUT_MS = 30_000;

async function request(
  method: string,
  path: string,
  options: { body?: object | string; apiKey?: string | null } = {}
): Promise<any> {
  const base = getMoltbookBase();
  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : '/' + path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.apiKey !== undefined && options.apiKey !== null) {
    headers['Authorization'] = `Bearer ${options.apiKey}`;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const init: RequestInit = {
    method: method || 'GET',
    headers,
    signal: controller.signal,
  };
  if (options.body != null) {
    init.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
  }
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err: any) {
    clearTimeout(timeout);
    if (err?.name === 'AbortError') {
      throw new Error(`Request timed out after ${DEFAULT_TIMEOUT_MS / 1000}s: ${method} ${path}`);
    }
    throw new Error(`Network error: ${err?.message || err} (${method} ${path})`);
  }
  clearTimeout(timeout);
  const text = await res.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(data?.error || data?.message || res.statusText || `HTTP ${res.status}`);
    (err as any).status = res.status;
    (err as any).data = data;
    throw err;
  }
  return data;
}

/** POST with FormData (e.g. file upload). Do not set Content-Type so fetch sets boundary. */
async function requestForm(
  method: string,
  path: string,
  formData: FormData,
  useAuth = true
): Promise<any> {
  const base = getMoltbookBase();
  const url = path.startsWith('http') ? path : `${base}${path.startsWith('/') ? path : '/' + path}`;
  const headers: Record<string, string> = {};
  if (useAuth) {
    headers['Authorization'] = `Bearer ${getApiKey()}`;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      method: method || 'POST',
      headers,
      body: formData,
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timeout);
    if (err?.name === 'AbortError') {
      throw new Error(`Request timed out after ${DEFAULT_TIMEOUT_MS / 1000}s: ${method} ${path}`);
    }
    throw new Error(`Network error: ${err?.message || err} (${method} ${path})`);
  }
  clearTimeout(timeout);
  const text = await res.text();
  let data: any;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(data?.error || data?.message || res.statusText || `HTTP ${res.status}`);
    (err as any).status = res.status;
    (err as any).data = data;
    throw err;
  }
  return data;
}

/** GET with optional auth (omit useAuth for register-only). */
export async function get(path: string, useAuth = true): Promise<any> {
  const apiKey = useAuth ? getApiKey() : undefined;
  return request('GET', path, { apiKey });
}

/** POST with optional auth and body. */
export async function post(path: string, body?: object, useAuth = true): Promise<any> {
  const apiKey = useAuth ? getApiKey() : undefined;
  return request('POST', path, { body: body ?? {}, apiKey });
}

/** PATCH with body. */
export async function patch(path: string, body: object): Promise<any> {
  return request('PATCH', path, { body, apiKey: getApiKey() });
}

/** DELETE (optionally with JSON body, e.g. for remove moderator). */
export async function del(path: string, body?: object): Promise<any> {
  return request('DELETE', path, { apiKey: getApiKey(), body: body ?? undefined });
}

/** POST with multipart/form-data (e.g. avatar or submolt banner). */
export async function postForm(path: string, formData: FormData): Promise<any> {
  return requestForm('POST', path, formData);
}
