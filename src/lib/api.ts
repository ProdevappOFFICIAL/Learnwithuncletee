/**
 * Typed fetch client for the Learnwithuncletee API.
 * Base URL: VITE_API_URL (e.g. http://localhost:4000/api).
 * Auth: Bearer access token persisted in localStorage by AuthContext.
 * Envelope: { success, data, meta?, message? }.
 */

import { queryClient } from './queryClient';
import { accountStore } from './accounts';

/** Session key shared with AuthContext (kept here to avoid an import cycle). */
export const SESSION_KEY = ['session'] as const;

/**
 * Tell every session consumer the active session is dead.
 *
 * If another account is saved on this device we switch straight to it instead
 * of throwing the user back to the login screen. Only when no saved account
 * remains do guards see a signed-out session.
 *
 * IMPORTANT: use setQueryData, NOT invalidateQueries. Invalidating refetches
 * /dashboard/me, which 401s -> refresh 401s -> lands back here -> infinite loop.
 */
function notifySessionDead() {
  const next = accountStore.removeActive();
  if (next) {
    tokenStore.set(next.accessToken ?? '', next.persistent);
    if (next.refreshToken) refreshTokenStore.set(next.refreshToken, next.persistent);
    else refreshTokenStore.clear();
  } else {
    tokenStore.clear();
    refreshTokenStore.clear();
  }
  try {
    queryClient.removeQueries();
    queryClient.setQueryData(SESSION_KEY, next?.user ?? null);
  } catch {
    /* query client not mounted yet */
  }
}

export const API_BASE =
  (import.meta as any).env?.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:4000/api';

const TOKEN_KEY = 'lwu_access_token';
const REFRESH_KEY = 'lwu_refresh_token';
const DEVICE_KEY = 'lwu_device_id';

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

/** Refresh token mirror of tokenStore — sent in the /auth/refresh body as a
 * fallback for contexts where the HttpOnly cookie is blocked (plain-http dev,
 * third-party-cookie blocking). Same storage posture as the access token. */
export const refreshTokenStore = {
  get: () => {
    try {
      return localStorage.getItem(REFRESH_KEY) ?? sessionStorage.getItem(REFRESH_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string, persistent = true) => {
    try {
      if (persistent) {
        localStorage.setItem(REFRESH_KEY, token);
        sessionStorage.removeItem(REFRESH_KEY);
      } else {
        sessionStorage.setItem(REFRESH_KEY, token);
        localStorage.removeItem(REFRESH_KEY);
      }
    } catch {
      /* private mode — ignore */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(REFRESH_KEY);
    } catch {
      /* ignore */
    }
    try {
      sessionStorage.removeItem(REFRESH_KEY);
    } catch {
      /* ignore */
    }
  },
};

/**
 * Stable per-browser device id. Send it as `deviceId` on login so the backend
 * scopes session reuse to this browser instead of rotating another device's
 * refresh token. Survives logout on purpose (it identifies the browser, not
 * the session).
 */
export const getDeviceId = (): string => {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `dev-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return `dev-${Math.random().toString(36).slice(2)}`;
  }
};

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/** Single-flight refresh: concurrent 401s share one refresh call. */
let refreshPromise: Promise<{ accessToken: string; refreshToken?: string }> | null = null;

async function refreshAccessToken(): Promise<{ accessToken: string; refreshToken?: string }> {
  if (!refreshPromise) {
    // The refresh token travels in the HttpOnly cookie (credentials:include);
    // the stored token is also sent in the body as a fallback for contexts
    // where the cookie is blocked or another account owns the cookie.
    refreshPromise = (async () => {
      const storedRefresh = refreshTokenStore.get();
      let res: Response;
      try {
        res = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(storedRefresh ? { refreshToken: storedRefresh } : {}),
        });
      } catch {
        // Network failure — retryable. Never discard a still-valid session
        // because the connection dropped for a moment.
        throw new ApiError(0, 'Could not reach the school service. Please try again.');
      }
      let payload: any = null;
      try {
        payload = await res.json();
      } catch {
        /* non-JSON */
      }
      if (res.status === 401 || res.status === 403) {
        throw new ApiError(res.status, payload?.message ?? 'Session expired');
      }
      if (!res.ok || !payload?.data?.accessToken) {
        // 5xx / proxy errors / malformed response are temporary, not logout.
        throw new ApiError(
          res.status || 0,
          payload?.message ?? 'Could not refresh the session. Please try again.',
        );
      }
      return {
        accessToken: payload.data.accessToken as string,
        refreshToken:
          typeof payload.data.refreshToken === 'string' ? payload.data.refreshToken : undefined,
      };
    })().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

/**
 * Refresh and persist the new tokens for the active account. A 401/403 means
 * the session is genuinely gone; anything else is temporary and must keep the
 * user signed in.
 */
async function refreshSession(): Promise<string> {
  try {
    const tokens = await refreshAccessToken();
    const persistent = tokenStore.isPersistent();
    tokenStore.set(tokens.accessToken, persistent);
    if (tokens.refreshToken) refreshTokenStore.set(tokens.refreshToken, persistent);
    const activeId = accountStore.activeId();
    if (activeId) {
      accountStore.setTokens(activeId, {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        persistent,
      });
    }
    return tokens.accessToken;
  } catch (error: any) {
    if (error?.status === 401 || error?.status === 403) {
      notifySessionDead();
      throw new ApiError(401, 'Session expired. Please sign in again.');
    }
    throw new ApiError(
      error?.status || 0,
      error?.message ?? 'Could not reach the school service. Your session is still saved — please try again.',
    );
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
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const isAuthEndpoint = normalizedPath.startsWith('/auth/');
  const url = new URL(`${API_BASE}${normalizedPath}`);
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
  // a 401 there is a credentials/refresh failure, not a reason to retry).
  if (res.status === 401 && auth && !isAuthEndpoint) {
    const fresh = await refreshSession();
    res = await send(fresh);
    payload = await readPayload(res);
  }

  if (!res.ok) {
    // A 401 from /auth/* (wrong password, bad refresh token) must NOT mark the
    // session dead — that is what used to kick off the refresh loop. Only a
    // 401 on a protected endpoint that survived the refresh attempt counts.
    if (res.status === 401 && auth && !isAuthEndpoint) notifySessionDead();
    throw new ApiError(res.status, payload?.message ?? `Request failed (${res.status})`);
  }
  return { data: payload?.data as T, meta: payload?.meta, message: payload?.message };
}

/**
 * Authenticated binary download (Excel/PDF). Reuses the same silent-refresh
 * path as `api`, then triggers the browser save dialog from the response blob.
 */
export async function apiDownload(
  path: string,
  query?: RequestOptions['query'],
): Promise<{ filename: string }> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${API_BASE}${normalizedPath}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
    }
  }

  const send = (accessToken: string | null) =>
    fetch(url.toString(), {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      credentials: 'include',
    });

  let res = await send(tokenStore.get());
  if (res.status === 401) {
    const fresh = await refreshSession();
    res = await send(fresh);
  }

  if (!res.ok) {
    let payload: any = null;
    try {
      payload = await res.json();
    } catch {
      /* binary/empty error body */
    }
    if (res.status === 401) notifySessionDead();
    throw new ApiError(res.status, payload?.message ?? `Download failed (${res.status})`);
  }

  const disposition = res.headers.get('content-disposition') ?? '';
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(disposition);
  let filename = 'results-export.xlsx';
  if (match?.[1]) {
    try {
      filename = decodeURIComponent(match[1].replace(/"/g, '').trim()) || filename;
    } catch {
      filename = match[1].replace(/"/g, '').trim() || filename;
    }
  }

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
  return { filename };
}

export const apiGet = <T = any>(path: string, query?: RequestOptions['query'], opts?: { auth?: boolean }) =>
  api<T>(path, { query, auth: opts?.auth ?? true });
/** Public GET - no Authorization header attempted (for public website endpoints). */
export const apiGetPublic = <T = any>(path: string, query?: RequestOptions['query']) =>
  api<T>(path, { query, auth: false });
export const apiPost = <T = any>(path: string, body?: unknown) => api<T>(path, { method: 'POST', body });
export const apiPatch = <T = any>(path: string, body?: unknown) => api<T>(path, { method: 'PATCH', body });
export const apiPut = <T = any>(path: string, body?: unknown) => api<T>(path, { method: 'PUT', body });
export const apiDelete = <T = any>(path: string) => api<T>(path, { method: 'DELETE' });

/**
 * Authenticated fetch that keeps the same silent-refresh behavior as `api()`.
 * Used for streaming endpoints (SSE) that cannot go through `res.json()`.
 */
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${API_BASE}${normalizedPath}`);

  const send = (accessToken: string | null) => {
    const headers = new Headers(init.headers);
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
    return fetch(url.toString(), {
      ...init,
      headers,
      credentials: 'include',
    });
  };

  let res = await send(tokenStore.get());
  if (res.status === 401) {
    const fresh = await refreshSession();
    res = await send(fresh);
  }

  if (!res.ok) {
    let payload: any = null;
    try {
      payload = await res.json();
    } catch {
      /* empty/stream body */
    }
    if (res.status === 401) notifySessionDead();
    throw new ApiError(res.status, payload?.message ?? `Request failed (${res.status})`);
  }
  return res;
}

/** Backend returns kobo ints — format as ₦ for display. */
export const formatNaira = (kobo: number | null | undefined) =>
  `₦${((kobo ?? 0) / 100).toLocaleString('en-NG')}`;