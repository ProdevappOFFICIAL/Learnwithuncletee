/**
 * Multi-account session vault.
 *
 * One browser can hold several signed-in accounts. The active account's tokens
 * are mirrored into the legacy token stores used by the API client, so every
 * existing request path keeps working; the vault only adds the ability to put
 * a different account's tokens back without asking for a password again.
 */

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

export interface StoredAccount {
  id: string;
  user: SessionUser;
  accessToken: string | null;
  refreshToken: string | null;
  /** Mirrors the Remember me choice used by the token stores. */
  persistent: boolean;
  addedAt: number;
  lastUsedAt: number;
}

/** Safe subset for React state/UI — never expose tokens in component props. */
export type AccountSummary = Pick<
  StoredAccount,
  'id' | 'user' | 'addedAt' | 'lastUsedAt'
>;

const ACCOUNTS_KEY = 'lwu_accounts_v1';
const ACTIVE_KEY = 'lwu_active_account';
const MAX_ACCOUNTS = 5;

const sortAccounts = (accounts: StoredAccount[]) =>
  [...accounts].sort((a, b) => b.lastUsedAt - a.lastUsedAt);

const read = (): StoredAccount[] => {
  try {
    const parsed = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (row): row is StoredAccount =>
          Boolean(row) &&
          typeof row === 'object' &&
          typeof row.id === 'string' &&
          Boolean(row.user) &&
          typeof row.user === 'object' &&
          typeof row.user.user_email === 'string',
      )
      .slice(0, MAX_ACCOUNTS);
  } catch {
    return [];
  }
};

const write = (accounts: StoredAccount[]) => {
  try {
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts.slice(0, MAX_ACCOUNTS)));
  } catch {
    /* private mode / quota — account switching stays in-memory for this tab */
  }
};

const writeActive = (id: string | null) => {
  try {
    if (id) localStorage.setItem(ACTIVE_KEY, id);
    else localStorage.removeItem(ACTIVE_KEY);
  } catch {
    /* ignore */
  }
};

const readActiveId = () => {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
};

const summariesOf = (accounts: StoredAccount[]): AccountSummary[] =>
  sortAccounts(accounts).map(({ id, user, addedAt, lastUsedAt }) => ({
    id,
    user,
    addedAt,
    lastUsedAt,
  }));

export const accountStore = {
  list: (): StoredAccount[] => sortAccounts(read()),

  summaries: (): AccountSummary[] => summariesOf(read()),

  activeId: (): string | null => {
    const accounts = read();
    const stored = readActiveId();
    if (stored && accounts.some((account) => account.id === stored)) return stored;
    // A corrupt/missing pointer falls back to the most recently used account.
    return sortAccounts(accounts)[0]?.id ?? null;
  },

  active: (): StoredAccount | null => {
    const id = accountStore.activeId();
    if (!id) return null;
    return read().find((account) => account.id === id) ?? null;
  },

  /**
   * Save/update an account and make it active. The access/refresh tokens are
   * optional so a profile refresh does not erase a still-valid token pair.
   */
  remember: (input: {
    user: SessionUser;
    accessToken?: string | null;
    refreshToken?: string | null;
    persistent?: boolean;
    makeActive?: boolean;
  }): StoredAccount => {
    const now = Date.now();
    const accounts = read();
    const existing = accounts.find((account) => account.id === input.user.id);
    const next: StoredAccount = {
      id: input.user.id,
      user: input.user,
      accessToken: input.accessToken ?? existing?.accessToken ?? null,
      refreshToken: input.refreshToken ?? existing?.refreshToken ?? null,
      persistent: input.persistent ?? existing?.persistent ?? true,
      addedAt: existing?.addedAt ?? now,
      lastUsedAt: now,
    };
    const merged = [next, ...accounts.filter((account) => account.id !== next.id)];
    write(merged);
    if (input.makeActive !== false) writeActive(next.id);
    return next;
  },

  /** Make an existing saved account active without changing its tokens. */
  activate: (id: string): StoredAccount | null => {
    const accounts = read();
    const account = accounts.find((row) => row.id === id);
    if (!account) return null;
    const next = { ...account, lastUsedAt: Date.now() };
    write([next, ...accounts.filter((row) => row.id !== id)]);
    writeActive(next.id);
    return next;
  },

  /** Called after a silent access-token refresh. */
  setTokens: (
    id: string,
    tokens: { accessToken?: string | null; refreshToken?: string | null; persistent?: boolean },
  ) => {
    const accounts = read();
    const index = accounts.findIndex((account) => account.id === id);
    if (index < 0) return;
    accounts[index] = {
      ...accounts[index],
      ...(tokens.accessToken !== undefined ? { accessToken: tokens.accessToken } : {}),
      ...(tokens.refreshToken !== undefined ? { refreshToken: tokens.refreshToken } : {}),
      ...(tokens.persistent !== undefined ? { persistent: tokens.persistent } : {}),
      lastUsedAt: Date.now(),
    };
    write(accounts);
  },

  /** Refresh the cached profile snapshot (e.g. name/avatar edit). */
  updateUser: (user: SessionUser) => {
    const accounts = read();
    const index = accounts.findIndex((account) => account.id === user.id);
    if (index < 0) return;
    accounts[index] = { ...accounts[index], user, lastUsedAt: Date.now() };
    write(accounts);
  },

  /**
   * Remove an account. When the removed account was active, returns the next
   * most-recent account so the caller can switch to it immediately.
   */
  remove: (id: string): StoredAccount | null => {
    const accounts = read();
    const wasActive = accountStore.activeId() === id;
    const remaining = accounts.filter((account) => account.id !== id);
    write(remaining);
    if (!wasActive) return null;
    const next = sortAccounts(remaining)[0] ?? null;
    writeActive(next?.id ?? null);
    return next;
  },

  removeActive: (): StoredAccount | null => {
    const id = accountStore.activeId();
    return id ? accountStore.remove(id) : null;
  },

  clear: () => {
    write([]);
    writeActive(null);
  },
};
