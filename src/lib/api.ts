/**
 * Typed fetch client for the Learnwithuncletee API.
 * Base URL: VITE_API_URL (e.g. http://localhost:4000/api).
 * Auth: Bearer access token persisted in localStorage by AuthContext.
 * Envelope: { success, data, meta?, message? }.
 */

export const API_BASE =
  (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:4000/api';

const TOKEN_KEY = 'lwu_access_token';

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* private mode — ignore */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  auth?: boolean;
}

export async function api<T = any>(path: string, opts: RequestOptions = {}): Promise<{ data: T; meta?: any; message?: string }> {
  const { method = 'GET', body, query, auth = true } = opts;
  const url = new URL(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
    }
  }
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url.toString(), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    /* non-JSON — handled below */
  }
  if (!res.ok) {
    throw new ApiError(res.status, payload?.message ?? `Request failed (${res.status})`);
  }
  return { data: payload?.data as T, meta: payload?.meta, message: payload?.message };
}

export const apiGet = <T = any>(path: string, query?: RequestOptions['query'], opts?: { auth?: boolean }) =>
  api<T>(path, { query, auth: opts?.auth ?? true });
/** Public GET — no Authorization header attempted (for public website endpoints). */
export const apiGetPublic = <T = any>(path: string, query?: RequestOptions['query']) =>
  api<T>(path, { query, auth: false });
export const apiPost = <T = any>(path: string, body?: unknown) => api<T>(path, { method: 'POST', body });
export const apiPatch = <T = any>(path: string, body?: unknown) => api<T>(path, { method: 'PATCH', body });
export const apiPut = <T = any>(path: string, body?: unknown) => api<T>(path, { method: 'PUT', body });
export const apiDelete = <T = any>(path: string) => api<T>(path, { method: 'DELETE' });

/** Backend returns kobo ints — format as ₦ for display. */
export const formatNaira = (kobo: number | null | undefined) =>
  `₦${((kobo ?? 0) / 100).toLocaleString('en-NG')}`;
