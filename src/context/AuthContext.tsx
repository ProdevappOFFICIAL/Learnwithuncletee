import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  api,
  apiPost,
  tokenStore,
  refreshTokenStore,
  getDeviceId,
  SESSION_KEY,
} from '@/lib/api';
import {
  accountStore,
  type AccountSummary,
  type SessionUser,
} from '@/lib/accounts';
import { queryClient } from '@/lib/queryClient';

export type { SessionUser } from '@/lib/accounts';

/** Preferred avatar: role profile photo first, then account image. */
export const avatarOf = (
  user: Pick<SessionUser, 'img' | 'student' | 'teacher' | 'admin'> | null | undefined,
) =>
  user?.student?.photoUrl ||
  user?.teacher?.photoUrl ||
  user?.admin?.photoUrl ||
  user?.img ||
  null;

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

/** Human-readable label shown in the Sessions list. */
const deviceName = () => {
  if (typeof navigator === 'undefined') return 'Web Browser';
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua)
    ? 'Edge'
    : /Chrome\//.test(ua)
      ? 'Chrome'
      : /Firefox\//.test(ua)
        ? 'Firefox'
        : /Safari\//.test(ua)
          ? 'Safari'
          : 'Browser';
  const platform = /Windows/.test(ua)
    ? 'Windows'
    : /Android/.test(ua)
      ? 'Android'
      : /iPhone|iPad/.test(ua)
        ? 'iOS'
        : /Mac/.test(ua)
          ? 'macOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : '';
  return `${browser}${platform ? ` on ${platform}` : ''}`;
};

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
  /** Other accounts saved on this device (for the sidebar switcher). */
  accounts: AccountSummary[];
  login: (identity: string, password: string, opts?: { remember?: boolean; role?: string }) => Promise<SessionUser>;
  logout: () => Promise<SessionUser | null>;
  switchAccount: (accountId: string) => Promise<SessionUser>;
  removeAccount: (accountId: string) => Promise<void>;
  refresh: () => Promise<void>;
  can: (permission: string) => boolean;
}

export const AuthCtx = createContext<AuthState>({
  user: null,
  loading: true,
  error: null,
  accounts: [],
  login: async () => {
    throw new Error('AuthProvider missing');
  },
  logout: async () => null,
  switchAccount: async () => {
    throw new Error('AuthProvider missing');
  },
  removeAccount: async () => {},
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
  const accountAtStart = accountStore.activeId();
  try {
    const { data } = await api<SessionUser>('/dashboard/me');
    if (!data) return null;

    const activeNow = accountStore.activeId();
    // A switch happened while /dashboard/me was in flight. Return the account
    // that is active now so a stale response cannot replace it.
    if (activeNow && activeNow !== data.id) {
      return accountStore.active()?.user ?? data;
    }
    // A logout happened while the request was in flight — do not resurrect it.
    if (!activeNow && accountAtStart) return null;

    accountStore.remember({
      user: data,
      accessToken: tokenStore.get(),
      refreshToken: refreshTokenStore.get(),
      persistent: tokenStore.isPersistent(),
      makeActive: true,
    });
    return data;
  } catch (e: any) {
    if (e?.status === 401) {
      // The 401 may have already triggered an automatic switch to another
      // saved account. Never overwrite that switch with a null session.
      return accountStore.active()?.user ?? null;
    }
    throw e;
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Restore the last account snapshot synchronously so the login page and
  // guards can route instantly while /dashboard/me revalidates in the
  // background. The API still verifies the session on every request.
  const [initialAccount] = useState(() => {
    const account = accountStore.active();
    const hasCredentials = Boolean(tokenStore.get() || refreshTokenStore.get());
    return account && hasCredentials ? account : null;
  });

  const {
    data: user = null,
    isLoading: loading,
    error: queryError,
  } = useQuery({
    queryKey: SESSION_KEY,
    queryFn: fetchMe,
    initialData: initialAccount?.user,
    initialDataUpdatedAt: initialAccount ? 0 : undefined,
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
  const [accounts, setAccounts] = useState<AccountSummary[]>(() => accountStore.summaries());
  const syncAccounts = useCallback(() => setAccounts(accountStore.summaries()), []);

  // Keep the switcher in sync when the background session check restores or
  // refreshes the account snapshot.
  useEffect(() => {
    syncAccounts();
  }, [user?.id, loading, syncAccounts]);

  const login = useCallback(async (identity: string, password: string, opts?: { remember?: boolean; role?: string }) => {
    // Scoped route: the selected tab determines which role model is searched.
    const { data } = await apiPost<{ user: any; accessToken: string; refreshToken?: string }>(
      loginEndpointFor(opts?.role),
      {
        user_email: identity,
        user_password: password,
        ...(opts?.role ? { role: opts.role } : {}),
        // Scope the server session to THIS browser. Without this the server
        // reused one session per account, so signing in on another device
        // silently invalidated everyone else's refresh token.
        deviceId: getDeviceId(),
        deviceName: deviceName(),
      },
    );
    const persistent = opts?.remember ?? true;
    tokenStore.set(data.accessToken, persistent);
    // Stored refresh token keeps silent refresh working even where the
    // HttpOnly cookie is blocked (plain-http dev, 3P-cookie blocking).
    if (data.refreshToken) refreshTokenStore.set(data.refreshToken, persistent);
    // Register the new identity before any /dashboard/me fallback so that
    // request cannot be mistaken for the previously active account.
    if (data.user?.id) {
      accountStore.remember({
        user: data.user as SessionUser,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken ?? refreshTokenStore.get(),
        persistent,
      });
    }
    // The login response already carries the role profile + permissions, so
    // seed the session cache without a second round trip. Fall back to
    // /dashboard/me for older servers that omit the permission list.
    const me: SessionUser | null = data.user?.permissions
      ? (data.user as SessionUser)
      : await fetchMe();
    if (!me) throw new Error('Sign-in succeeded but the session could not be verified.');

    accountStore.remember({
      user: me,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken ?? refreshTokenStore.get(),
      persistent,
    });
    syncAccounts();

    // Drop every cached query from the previous account, then seed this one.
    await queryClient.cancelQueries();
    queryClient.removeQueries();
    queryClient.setQueryData(SESSION_KEY, me);
    setSignedOut(false);
    return me;
  }, [syncAccounts]);

  const logout = useCallback(async (): Promise<SessionUser | null> => {
    // Local logout first: block every consumer immediately, scrub the stored
    // credentials, and stop in-flight session checks. A late /dashboard/me
    // response must never restore the account we just left.
    const active = accountStore.active();
    const refreshToken = refreshTokenStore.get() ?? active?.refreshToken ?? undefined;
    const next = accountStore.removeActive();

    tokenStore.clear();
    refreshTokenStore.clear();
    await queryClient.cancelQueries();
    queryClient.removeQueries();

    if (next) {
      // More accounts remain on this device: switch into the most recent one
      // instead of forcing a fresh login.
      if (next.accessToken) tokenStore.set(next.accessToken, next.persistent);
      if (next.refreshToken) refreshTokenStore.set(next.refreshToken, next.persistent);
      queryClient.setQueryData(SESSION_KEY, next.user);
      setSignedOut(false);
      setAccounts(accountStore.summaries());
      void queryClient.invalidateQueries({ queryKey: SESSION_KEY });
    } else {
      queryClient.setQueryData(SESSION_KEY, null);
      setSignedOut(true);
      setAccounts([]);
    }

    // Revoke only the account we signed out of. Other saved accounts keep
    // their own server sessions.
    void apiPost('/auth/logout', { refreshToken }).catch(() => {
      /* best effort — local session is already gone */
    });

    return next?.user ?? null;
  }, []);

  const switchAccount = useCallback(async (accountId: string): Promise<SessionUser> => {
    const account = accountStore.activate(accountId);
    if (!account) throw new Error('That account is no longer saved on this device.');

    if (account.accessToken) tokenStore.set(account.accessToken, account.persistent);
    else tokenStore.clear();
    if (account.refreshToken) refreshTokenStore.set(account.refreshToken, account.persistent);
    else refreshTokenStore.clear();

    setSignedOut(false);
    setAccounts(accountStore.summaries());

    // Never let one account see another account's cached dashboard data.
    await queryClient.cancelQueries();
    queryClient.removeQueries();
    queryClient.setQueryData(SESSION_KEY, account.user);
    // Validate in the background; the saved profile renders immediately.
    void queryClient.invalidateQueries({ queryKey: SESSION_KEY });

    return account.user;
  }, []);

  const removeAccount = useCallback(async (accountId: string) => {
    if (accountId === accountStore.activeId()) {
      await logout();
      return;
    }
    const account = accountStore.list().find((row) => row.id === accountId);
    if (!account) return;
    accountStore.remove(accountId);
    setAccounts(accountStore.summaries());
    if (account.refreshToken) {
      void apiPost('/auth/logout', { refreshToken: account.refreshToken }).catch(() => {
        /* best effort */
      });
    }
  }, [logout]);

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: SESSION_KEY });
    syncAccounts();
  }, [syncAccounts]);

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
      error: !currentUser && queryError ? 'Session expired' : null,
      accounts,
      login,
      logout,
      switchAccount,
      removeAccount,
      refresh,
      can,
    }),
    [
      currentUser,
      signedOut,
      loading,
      queryError,
      accounts,
      login,
      logout,
      switchAccount,
      removeAccount,
      refresh,
      can,
    ],
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
    if (!path || (!tokenStore.get() && !refreshTokenStore.get())) {
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
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, meta, loading, error, reload: load, setData };
}
