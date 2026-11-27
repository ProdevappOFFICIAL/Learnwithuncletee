import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Plus, UserRound, X } from 'lucide-react';
import { avatarOf, useAuth } from '@/context/AuthContext';
import { ROUTES } from '@/routes/paths';

type RoleHint = 'STUDENT' | 'TEACHER' | 'MEMBER' | 'ADMIN';

const ROLES: Array<{ value: RoleHint; label: string; hint: string }> = [
  { value: 'STUDENT', label: 'Student', hint: 'Admission number or email' },
  { value: 'TEACHER', label: 'Teacher', hint: 'Staff code or email' },
  { value: 'MEMBER', label: 'Member', hint: 'Staff code or email' },
  { value: 'ADMIN', label: 'Admin', hint: 'Staff code or email' },
];

const homeForRole = (role: string) => {
  if (role === 'STUDENT' || role === 'PARENT') return ROUTES.studentDashboard;
  if (role === 'TEACHER') return ROUTES.teacherDashboard;
  return ROUTES.adminDashboard;
};

const roleLabel = (role: string) =>
  role === 'OWNER'
    ? 'Owner'
    : role.charAt(0) + role.slice(1).toLowerCase();

const initialsOf = (name: string) =>
  name
    .split(' ')
    .map((part) => part.replace('.', '')[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'LW';

const inputClass =
  'mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

export const AccountSwitcherDialog = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const { user, accounts, login, switchAccount, removeAccount } = useAuth();
  const [view, setView] = useState<'list' | 'add'>('list');
  const [roleHint, setRoleHint] = useState<RoleHint>('STUDENT');
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentRole = ROLES.find((role) => role.value === roleHint) ?? ROLES[0];

  useEffect(() => {
    if (!open) return;
    setView('list');
    setIdentity('');
    setPassword('');
    setError(null);
    setBusy(false);
    setBusyId(null);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const goHome = (role: string) => {
    onClose();
    // Full navigation + reload so every dashboard query, layout and role
    // guard is rebuilt from the newly active account.
    window.location.assign(homeForRole(role));
  };

  const useAccount = async (accountId: string) => {
    if (accountId === user?.id || busyId) return;
    setBusyId(accountId);
    setError(null);
    try {
      const me = await switchAccount(accountId);
      goHome(me.role);
    } catch (err: any) {
      setError(err?.message ?? 'Could not switch account.');
      setBusyId(null);
    }
  };

  const addAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!identity.trim() || !password) {
      setError('Enter the account ID/email and password.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const me = await login(identity.trim(), password, { role: roleHint, remember: true });
      goHome(me.role);
    } catch (err: any) {
      setError(err?.message ?? 'Could not add that account.');
    } finally {
      setBusy(false);
    }
  };

  const forget = async (accountId: string) => {
    if (busyId) return;
    setBusyId(accountId);
    setError(null);
    try {
      await removeAccount(accountId);
    } catch (err: any) {
      setError(err?.message ?? 'Could not remove that account.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className={`fixed inset-0 z-[60] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-brand-900/60 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        className="absolute inset-0 flex items-center justify-center p-4"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Switch account"
          className={`flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded bg-white shadow-xl transition-all ${
            open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-brand-700">
                Accounts on this device
              </p>
              <h2 className="mt-0.5 font-display text-lg font-extrabold">
                {view === 'add' ? 'Add another account' : 'Switch account'}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close account switcher"
              className="flex h-10 w-10 items-center justify-center rounded border border-line text-brand-800 hover:bg-brand-50"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
            {view === 'list' ? (
              <>
                <p className="text-sm leading-6 text-muted">
                  Click any account to switch instantly. Every saved account stays signed in until
                  you remove it or sign out.
                </p>

                <ul className="mt-4 space-y-2">
                  {accounts.map((account) => {
                    const isCurrent = account.id === user?.id;
                    const avatar = avatarOf(account.user);
                    return (
                      <li key={account.id} className="relative">
                        <button
                          type="button"
                          onClick={() => void useAccount(account.id)}
                          disabled={isCurrent || Boolean(busyId)}
                          className={`flex w-full items-center gap-3 rounded border p-3 text-left transition-colors ${
                            isCurrent
                              ? 'border-brand-300 bg-brand-50'
                              : 'border-line bg-white hover:border-brand-400 hover:bg-cream'
                          } disabled:cursor-default`}
                        >
                          {avatar ? (
                            <img src={avatar} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" />
                          ) : (
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-900 text-xs font-extrabold text-lime-accent">
                              {initialsOf(account.user.user_name)}
                            </span>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                              <span className="truncate text-sm font-bold text-ink">
                                {account.user.user_name}
                              </span>
                              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700">
                                {roleLabel(account.user.role)}
                              </span>
                              {isCurrent && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                                  <Check size={10} aria-hidden="true" /> Current
                                </span>
                              )}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-muted">
                              {account.user.user_email}
                            </span>
                            {busyId === account.id && (
                              <span className="mt-0.5 block text-[11px] font-semibold text-brand-700">
                                Switching…
                              </span>
                            )}
                          </span>
                        </button>
                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void forget(account.id);
                            }}
                            disabled={Boolean(busyId)}
                            aria-label={`Remove ${account.user.user_name} from this device`}
                            title="Remove from this device"
                            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-rose-50 hover:text-rose-700 disabled:opacity-40"
                          >
                            <X size={13} aria-hidden="true" />
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ul>

                <button
                  type="button"
                  onClick={() => {
                    setView('add');
                    setError(null);
                  }}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded border border-dashed border-brand-300 bg-brand-50/40 px-4 py-3 text-sm font-bold text-brand-800 hover:border-brand-500 hover:bg-brand-50"
                >
                  <Plus size={16} aria-hidden="true" /> Add another account
                </button>

                <p className="mt-4 text-xs leading-5 text-muted">
                  Adding an account does not sign out the current one. You can keep up to five
                  accounts and switch between them from the sidebar.
                </p>
              </>
            ) : (
              <form onSubmit={addAccount} className="space-y-5">
                <button
                  type="button"
                  onClick={() => {
                    setView('list');
                    setError(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-500"
                >
                  <ArrowLeft size={13} aria-hidden="true" /> Back to saved accounts
                </button>

                <div>
                  <p className="text-sm font-semibold">Account type</p>
                  <div className="mt-2 grid grid-cols-2 gap-1 rounded border border-line bg-cream p-1 sm:grid-cols-4">
                    {ROLES.map((role) => (
                      <button
                        key={role.value}
                        type="button"
                        aria-pressed={roleHint === role.value}
                        onClick={() => setRoleHint(role.value)}
                        className={`rounded px-2 py-2 text-xs font-bold transition-colors ${
                          roleHint === role.value
                            ? 'bg-brand-900 text-white'
                            : 'text-muted hover:text-ink'
                        }`}
                      >
                        {role.label}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="block text-sm font-semibold">
                  {currentRole.label} ID or email
                  <input
                    value={identity}
                    onChange={(event) => setIdentity(event.target.value)}
                    className={inputClass}
                    autoComplete="username"
                    placeholder={currentRole.hint}
                    required
                  />
                </label>

                <label className="block text-sm font-semibold">
                  Password
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={inputClass}
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </label>

                <button
                  type="submit"
                  disabled={busy}
                  className="min-h-11 w-full rounded bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {busy ? 'Adding account…' : 'Add account'}
                </button>

                <p className="flex items-start gap-2 text-xs leading-5 text-muted">
                  <UserRound size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
                  Only use accounts that belong to you. The current account remains signed in on
                  this device.
                </p>
              </form>
            )}

            {error && (
              <p role="alert" className="mt-4 border-l-2 border-rose-400 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {error}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
