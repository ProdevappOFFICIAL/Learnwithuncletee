import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, apiPost, tokenStore } from '@/lib/api';

export interface SessionUser {
  id: string;
  user_name: string;
  user_email: string;
  role: string;
  img?: string | null;
  studentProfile?: { studentCode: string; className: string } | null;
  teacherProfile?: { staffCode: string; department?: string } | null;
  permissions: string[];
}

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
  login: (identity: string, password: string) => Promise<SessionUser>;
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

async function fetchMe(): Promise<SessionUser> {
  const { data } = await api<SessionUser>('/dashboard/me');
  return data;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
    try {
      setUser(await fetchMe());
      setError(null);
    } catch (e: any) {
      if (e?.status === 401) tokenStore.clear();
      setError(e?.message ?? 'Session expired');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (identity: string, password: string) => {
    // Backend login accepts user_email today; student/staff codes are
    // resolved profile-side after sign-in (see api-docs § Auth).
    const { data } = await apiPost<{ user: any; accessToken: string }>('/auth/login', {
      user_email: identity,
      user_password: password,
    });
    tokenStore.set(data.accessToken);
    const me = await fetchMe();
    setUser(me);
    setError(null);
    return me;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiPost('/auth/logout');
    } catch {
      /* still clear locally */
    }
    tokenStore.clear();
    setUser(null);
  }, []);

  const can = useCallback(
    (permission: string) => {
      if (!user) return false;
      if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') return true;
      return user.permissions.includes(permission);
    },
    [user],
  );

  const value = useMemo(
    () => ({ user, loading, error, login, logout, refresh, can }),
    [user, loading, error, login, logout, refresh, can],
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
