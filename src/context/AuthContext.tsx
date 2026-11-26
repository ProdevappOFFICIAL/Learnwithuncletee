import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, apiPost, tokenStore, refreshTokenStore, SESSION_KEY } from '@/lib/api';
import { queryClient } from '@/lib/queryClient';


/** Preferred avatar: role profile photo first, then account image. */
export const avatarOf = (
  user: Pick<SessionUser, 'img' | 'student' | 'teacher' | 'admin'> | null | undefined,
) =>
  user?.student?.photoUrl ||
  user?.teacher?.photoUrl ||
  user?.admin?.photoUrl ||
  user?.img ||
  null;

export interface SessionUser {
  id: string;
  user_name: string;
  user_email: string;
  role: string;
  img?: string | null;
  workspaceId?: string;
  student?: { studentCode: string; className: string; photoUrl?: string | null } | null;
  teacher?: { staffCode: string; department?: string; photoUrl?: string | null } | null;
  admin?: { staffCode: string; department?: string; photoUrl?: string | null } | null;
  permissions: string[];
}

/**
 * Role hint → role-scoped login route. The server enforces the scope, so a
 * student ID cannot sign in through the admin/member/teacher tabs.
 */
const LOGIN_ENDPOINTS: Record<string, string> = {
  STUDENT: '/auth/login/student',
  PARENT: '/auth/login/student',
  TEACHER: '/auth/login/teacher',
  MEMBER: '/auth/login/member',
  ADMIN: '/auth/login/admin',
  OWNER: '/auth/login/admin',
};

const loginEndpointFor = (role?: string) =>
  LOGIN_ENDPOINTS[String(role ?? '').trim().toUpperCase()] ?? '/auth/login';

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
  // Fast path: no tokens anywhere means logged out — skip the network
  // entirely instead of firing me → refresh → 401 console spam.
  if (!tokenStore.get() && !refreshTokenStore.get()) return null;
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

  // Hard local switch. React Query can briefly retain the previous user while
  // queries are removed/refetched, and an in-flight /dashboard/me can resolve
  // after logout. This flag makes every consumer see "signed out" immediately,
  // so /login never bounces a just-logged-out user back to their old dashboard.
  const [signedOut, setSignedOut] = useState(false);

  const login = useCallback(async (identity: string, password: string, opts?: { remember?: boolean; role?: string }) => {
    // Scoped route: the selected tab determines which role model is searched.
    const { data } = await apiPost<{ user: any; accessToken: string; refreshToken?: string }>(
      loginEndpointFor(opts?.role),
      {
        user_email: identity,
        user_password: password,
        ...(opts?.role ? { role: opts.role } : {}),
      },
    );
    const persistent = opts?.remember ?? true;
    tokenStore.set(data.accessToken, persistent);
    // Stored refresh token keeps silent refresh working even where the
    // HttpOnly cookie is blocked (plain-http dev, 3P-cookie blocking).
    if (data.refreshToken) refreshTokenStore.set(data.refreshToken, persistent);
    // The login response already carries the role profile + permissions, so
    // seed the session cache without a second round trip. Fall back to
    // /dashboard/me for older servers that omit the permission list.
    const me: SessionUser | null = data.user?.permissions
      ? (data.user as SessionUser)
      : await fetchMe();
    if (!me) throw new Error('Sign-in succeeded but the session could not be verified.');
    // Instant UI: seed the cache so protected routes render without a flash,
    // and only now lift the logout barrier.
    queryClient.setQueryData(SESSION_KEY, me);
    setSignedOut(false);
    return me;
  }, []);

  const logout = useCallback(async () => {
    // Local logout first: block every consumer immediately, scrub the stored
    // credentials, and stop in-flight session checks. A late /dashboard/me
    // response must never restore the account we just left.
    setSignedOut(true);
    const refreshToken = refreshTokenStore.get() ?? undefined;
    tokenStore.clear();
    refreshTokenStore.clear();
    await queryClient.cancelQueries();
    queryClient.setQueryData(SESSION_KEY, null);
    // Drop every cached query (dashboard lists, notifications, …) so the next
    // account can never see the previous user's data. Re-seed the session as
    // logged out afterwards; the AuthProvider observes that key.
    queryClient.removeQueries();
    queryClient.setQueryData(SESSION_KEY, null);
    // Revoke the server session in the background — local logout must not
    // wait on the network, and the captured token still identifies the old
    // session even though it is gone from storage.
    void apiPost('/auth/logout', { refreshToken }).catch(() => {
      /* best effort — local session is already gone */
    });
  }, []);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: SESSION_KEY });
  }, []);

  // Consumers never see a user while the local logout barrier is up, even if
  // an old query result is still lingering in memory.
  const currentUser = signedOut ? null : user;

  const can = useCallback(
    (permission: string) => {
      if (!currentUser) return false;
      if (currentUser.role === 'ADMIN' || currentUser.role === 'OWNER') return true;
      return currentUser.permissions.includes(permission);
    },
    [currentUser],
  );

  const value = useMemo(
    () => ({
      user: currentUser,
      loading: signedOut ? false : loading,
      error: queryError && !signedOut ? 'Session expired' : null,
      login,
      logout,
      refresh,
      can,
    }),
    [currentUser, signedOut, loading, queryError, login, logout, refresh, can],
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
