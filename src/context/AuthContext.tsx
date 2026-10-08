import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, apiPost, tokenStore, refreshTokenStore, SESSION_KEY } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';


/** Preferred avatar: role profile photo first, then account image. */
export const avatarOf = (user: Pick<SessionUser, 'img' | 'student' | 'teacher'> | null | undefined) =>
  user?.student?.photoUrl || user?.teacher?.photoUrl || user?.img || null;

export interface SessionUser {
  id: string;
  user_name: string;
  user_email: string;
  role: string;
  img?: string | null;
  workspaceId?: string;
  student?: { studentCode: string; className: string; photoUrl?: string | null } | null;
  teacher?: { staffCode: string; department?: string; photoUrl?: string | null } | null;
  permissions: string[];
}

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
  login: (identity: string, password: string, opts?: { remember?: boolean; role?: string }) => Promise<SessionUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  can: (permission: string) => boolean;
}

export const AuthCtx = createContext<AuthState>({
  user: null,
  loading: true,
  error: null,
  login: async () => {
    throw new Error('AuthProvider missing');
  },
  logout: async () => {},
  refresh: async () => {},
  can: () => false,
});

export const useAuth = () => useContext(AuthCtx);

async function fetchMe(): Promise<SessionUser | null> {
  // Always attempt: even with no stored access token, the HttpOnly refresh
  // cookie may still hold a session — the api layer attempts one silent
  // refresh on 401 before giving up.
  try {
    const { data } = await api<SessionUser>('/dashboard/me');
    return data ?? null;
  } catch (e: any) {
    if (e?.status === 401) return null;
    throw e;
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const {
    data: user = null,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: SESSION_KEY,
    queryFn: fetchMe,
    // Don't retry: a 401 already went through the single refresh attempt.
    retry: false,
    // Off: with no session, every tab-focus refires me → refresh → 401
    // console spam. Session still revalidates on mount and after login/logout.
    refetchOnWindowFocus: false,
  });

  const login = useCallback(async (identity: string, password: string, opts?: { remember?: boolean; role?: string }) => {
    const { data } = await apiPost<{ user: any; accessToken: string; refreshToken?: string }>('/auth/login', {
      user_email: identity,
      user_password: password,
      ...(opts?.role ? { role: opts.role } : {}),
    });
    const persistent = opts?.remember ?? true;
    tokenStore.set(data.accessToken, persistent);
    // Stored refresh token keeps silent refresh working even where the
    // HttpOnly cookie is blocked (plain-http dev, 3P-cookie blocking).
    if (data.refreshToken) refreshTokenStore.set(data.refreshToken, persistent);
    const me = await fetchMe();
    if (!me) throw new Error('Sign-in succeeded but the session could not be verified.');
    // Instant UI: seed the cache so protected routes render without a flash.
    queryClient.setQueryData(SESSION_KEY, me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    try {
      // Send the stored refresh token too: the backend revokes by body token
      // when the HttpOnly cookie is unavailable.
      await apiPost('/auth/logout', { refreshToken: refreshTokenStore.get() ?? undefined });
    } catch {
      /* still clear locally */
    }
    tokenStore.clear();
    refreshTokenStore.clear();
    queryClient.removeQueries({ queryKey: SESSION_KEY });
  }, []);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: SESSION_KEY });
  }, []);

  const can = useCallback(
    (permission: string) => {
      if (!user) return false;
      if (user.role === 'ADMIN' || user.role === 'OWNER') return true;
      return user.permissions.includes(permission);
    },
    [user],
  );

  const value = useMemo(
    () => ({ user, loading, error: queryError ? 'Session expired' : null, login, logout, refresh, can }),
    [user, loading, queryError, login, logout, refresh, can],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
};

/** Generic GET hook for dashboard resources. */
export function useResource<T = any>(path: string | null, query?: Record<string, string | number | boolean | undefined>) {
  const [data, setData] = useState<T | null>(null);
  const [meta, setMeta] = useState<any>(null);
  const [loading, setLoading] = useState(Boolean(path));
  const [error, setError] = useState<string | null>(null);
  const key = useMemo(() => JSON.stringify({ path, query }), [path, query]);

  const load = useCallback(async () => {
    if (!path || !tokenStore.get()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api<T>(path, { query });
      setData(res.data);
      setMeta(res.meta ?? null);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, meta, loading, error, reload: load, setData };
}
