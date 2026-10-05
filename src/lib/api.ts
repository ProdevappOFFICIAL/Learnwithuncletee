/**
 * Typed fetch client for the Learnwithuncletee API.
 * Base URL: VITE_API_URL (e.g. http://localhost:4000/api).
 * Auth: Bearer access token persisted in localStorage by AuthContext.
 * Envelope: { success, data, meta?, message? }.
 */

import { queryClient } from './queryClient';

/** Session key shared with AuthContext (kept here to avoid an import cycle). */
export const SESSION_KEY = ['session'] as const;

/** Tell every session consumer the session is dead (guards redirect to login). */
function notifySessionDead() {
  tokenStore.clear();
  try {
    queryClient.invalidateQueries({ queryKey: SESSION_KEY });
  } catch {
    /* query client not mounted yet */
  }
}

export const API_BASE =
  (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:4000/api';

const TOKEN_KEY = 'lwu_access_token';

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY) ?? sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  /** persistent=true → localStorage (remember me); false → sessionStorage (cleared on tab close). */
  set: (token: string, persistent = true) => {
    try {
      if (persistent) {
        localStorage.setItem(TOKEN_KEY, token);
        sessionStorage.removeItem(TOKEN_KEY);
      } else {
        sessionStorage.setItem(TOKEN_KEY, token);
        localStorage.removeItem(TOKEN_KEY);
      }
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
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
  /** True when the stored token survives restarts (remember-me was on). */
  isPersistent: () => {
    try {
      return localStorage.getItem(TOKEN_KEY) !== null;
    } catch {
      return false;
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

/** Single-flight refresh: concurrent 401s share one refresh call. */
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    // The refresh token travels in the HttpOnly cookie (credentials:include).
    // No token is readable from JS by design; if the cookie is absent
    // (e.g. localhost http drops `secure` cookies), this 401s and the
    // caller treats the session as over.
    refreshPromise = (async () => {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: '{}',
      });
      let payload: any = null;
      try {
        payload = await res.json();
      } catch {
        /* non-JSON */
      }
      if (!res.ok || !payload?.data?.accessToken) {
        throw new ApiError(res.status, payload?.message ?? 'Session expired');
      }
      return payload.data.accessToken as string;
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
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

  const send = async (accessToken: string | null) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (auth && accessToken) headers.Authorization = `Bearer ${accessToken}`;
    return fetch(url.toString(), {
      method,
      headers,
      // include → HttpOnly refresh cookie travels on auth endpoints too.
      credentials: 'include',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  };

  const readPayload = async (res: Response) => {
    try {
      return await res.json();
    } catch {
      return null;
    }
  };

  let res = await send(auth ? tokenStore.get() : null);
  let payload = await readPayload(res);

  // One silent refresh on 401 (never for the auth endpoints themselves —
  // a 401 there means the session is genuinely over).
  if (res.status === 401 && auth && !path.startsWith('/auth/')) {
    try {
      const fresh = await refreshAccessToken();
      tokenStore.set(fresh, tokenStore.isPersistent());
      res = await send(fresh);
      payload = await readPayload(res);
    } catch {
      notifySessionDead();
      throw new ApiError(401, 'Session expired. Please sign in again.');
    }
  }

  if (!res.ok) {
    if (res.status === 401) notifySessionDead();
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
