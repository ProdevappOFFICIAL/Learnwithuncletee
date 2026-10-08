import { useEffect, useState } from 'react';
import { Bell, KeyRound, MonitorSmartphone, Smartphone, UserRound, X } from 'lucide-react';
import { avatarOf, useAuth } from '@/context/AuthContext';
import { apiDelete, apiGet, apiPatch, apiPut } from '@/lib/api';
import { UploadButton } from '@/lib/uploadthing';

type Tab = 'profile' | 'security' | 'sessions' | 'preferences';

const tabs: Array<{ id: Tab; label: string; icon: typeof UserRound }> = [
  { id: 'profile', label: 'Profile', icon: UserRound },
  { id: 'security', label: 'Password & security', icon: KeyRound },
  { id: 'sessions', label: 'Sessions', icon: MonitorSmartphone },
  { id: 'preferences', label: 'Notifications', icon: Bell },
];

interface SessionRow {
  id: string;
  deviceType: string;
  deviceName?: string | null;
  lastUsedAt: string;
  createdAt: string;
}

const PREFS_KEY = 'lwu_notif_prefs';
const PREF_DEFS = [
  { id: 'fees', label: 'Fee reminders', hint: 'Balance-due alerts in the drawer badge' },
  { id: 'assignments', label: 'Assignment alerts', hint: 'Pending work and grading queue' },
  { id: 'live', label: 'Live class alerts', hint: 'Upcoming virtual lessons' },
] as const;

const readPrefs = (): Record<string, boolean> => {
  try {
    return { fees: true, assignments: true, live: true, ...(JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as Record<string, boolean>) };
  } catch {
    return { fees: true, assignments: true, live: true };
  }
};

export const AccountDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { user, refresh } = useAuth();
  const [tab, setTab] = useState<Tab>('profile');

  // profile
  const [name, setName] = useState('');
  const [photo, setPhoto] = useState('');
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileBusy, setProfileBusy] = useState(false);

  // security
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [signOutOthers, setSignOutOthers] = useState(true);
  const [securityMsg, setSecurityMsg] = useState<string | null>(null);
  const [securityBusy, setSecurityBusy] = useState(false);

  // sessions
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [sessionsError, setSessionsError] = useState<string | null>(null);

  // preferences
  const [prefs, setPrefs] = useState<Record<string, boolean>>(readPrefs);

  useEffect(() => {
    if (open && user) {
      setName(user.user_name);
      setPhoto(avatarOf(user) ?? '');
      setProfileMsg(null);
      setSecurityMsg(null);
    }
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, user?.id]);

  const loadSessions = () => {
    setSessions(null);
    setSessionsError(null);
    apiGet<SessionRow[]>('/auth/sessions')
      .then((res) => setSessions(res.data))
      .catch((e: any) => setSessionsError(e?.message ?? 'Could not load sessions'));
  };

  useEffect(() => {
    if (open && tab === 'sessions') loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tab]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!name.trim()) {
      setProfileMsg('Enter your full name.');
      return;
    }
    setProfileBusy(true);
    setProfileMsg(null);
    try {
      if (user.role === 'STUDENT') {
        await apiPatch(`/students/${user.id}`, { user_name: name.trim(), photoUrl: photo || undefined });
      } else if (user.role === 'TEACHER') {
        await apiPatch(`/staff/${user.id}`, { user_name: name.trim(), photoUrl: photo || undefined });
      } else {
        await apiPut(`/users/${user.id}`, { user_name: name.trim(), img: photo || undefined });
      }
      await refresh();
      setProfileMsg('Profile updated.');
    } catch (err: any) {
      setProfileMsg(err?.message ?? 'Could not save profile');
    } finally {
      setProfileBusy(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setSecurityMsg('New password must be at least 8 characters.');
      return;
    }
    setSecurityBusy(true);
    setSecurityMsg(null);
    try {
      await apiPut('/users/profile/change-password', { currentPassword, newPassword, signOutOthers });
      setSecurityMsg('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setSecurityMsg(err?.message ?? 'Could not change password');
    } finally {
      setSecurityBusy(false);
    }
  };

  const revokeSession = async (id: string) => {
    try {
      await apiDelete(`/auth/sessions/${id}`);
      setSessions((s) => (s ?? []).filter((row) => row.id !== id));
    } catch (err: any) {
      setSessionsError(err?.message ?? 'Could not revoke session');
    }
  };

  const togglePref = (id: string) => {
    setPrefs((p) => {
      const next = { ...p, [id]: !p[id] };
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const inputClass = 'mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500';

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div onClick={onClose} className={`absolute inset-0 bg-brand-900/60 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Account settings"
          className={`flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded bg-white shadow-xl transition-all sm:flex-row ${
            open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          {/* Sidebar */}
          <div className="shrink-0 border-b border-line bg-brand-900 text-white sm:w-56 sm:border-b-0 sm:border-r">
            <div className="flex items-center gap-3 p-5">
              {avatarOf(user) ? (
                <img src={avatarOf(user) as string} alt="" className="h-11 w-11 rounded-full object-cover" />
              ) : (
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-lime-accent text-sm font-extrabold text-brand-900">
                  {(user?.user_name ?? '?').slice(0, 2).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">{user?.user_name ?? 'Account'}</p>
                <p className="truncate text-xs text-white/60">{user?.role ?? ''}</p>
              </div>
            </div>
            <nav className="flex gap-1 overflow-x-auto px-3 pb-3 sm:flex-col sm:pb-5" aria-label="Account sections">
              {tabs.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    aria-current={tab === t.id ? 'page' : undefined}
                    className={`flex shrink-0 items-center gap-2 rounded px-3 py-2.5 text-sm font-semibold transition-colors ${
                      tab === t.id ? 'bg-lime-accent text-brand-900' : 'text-white/75 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon size={15} aria-hidden="true" /> {t.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
              <h2 className="font-display text-lg font-extrabold">{tabs.find((t) => t.id === tab)?.label}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close account settings"
                className="flex h-10 w-10 items-center justify-center rounded border border-line text-brand-800 hover:bg-brand-50"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            <div className="px-5 py-5">
              {tab === 'profile' && (
                <form onSubmit={saveProfile} className="space-y-4">
                  <div className="flex items-center gap-4">
                    {photo ? (
                      <img src={photo} alt="Avatar preview" className="h-16 w-16 rounded-full border border-line object-cover" />
                    ) : (
                      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-lg font-extrabold text-brand-700">
                        {(name || '?').slice(0, 2).toUpperCase()}
                      </span>
                    )}
                    <div>
                      <p className="text-sm font-semibold">Avatar image {photo && <span className="text-emerald-700">✓ set</span>}</p>
                      <div className="mt-2">
                        <UploadButton endpoint="avatarUploader" label="Upload avatar" onClientUploadComplete={(res) => setPhoto(res?.[0]?.ufsUrl ?? '')} onUploadError={(err) => setProfileMsg(err.message)} />
                      </div>
                    </div>
                  </div>
                  <label className="block text-sm font-semibold">Full name<input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} /></label>
                  <label className="block text-sm font-semibold">Email (managed by the school)<input value={user?.user_email ?? ''} disabled className={`${inputClass} bg-cream text-muted`} /></label>
                  <button type="submit" disabled={profileBusy} className="min-h-11 w-full rounded bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
                    {profileBusy ? 'Saving…' : 'Save profile'}
                  </button>
                  {profileMsg && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{profileMsg}</p>}
                </form>
              )}

              {tab === 'security' && (
                <form onSubmit={changePassword} className="space-y-4">
                  <label className="block text-sm font-semibold">Current password<input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required autoComplete="current-password" className={inputClass} /></label>
                  <label className="block text-sm font-semibold">New password (min 8 characters)<input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} autoComplete="new-password" className={inputClass} /></label>
                  <label className="flex items-center gap-2 text-sm font-semibold">
                    <input type="checkbox" checked={signOutOthers} onChange={(e) => setSignOutOthers(e.target.checked)} className="h-4 w-4 accent-brand-700" />
                    Sign out all other devices
                  </label>
                  <button type="submit" disabled={securityBusy} className="min-h-11 w-full rounded bg-brand-900 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
                    {securityBusy ? 'Updating…' : 'Change password'}
                  </button>
                  {securityMsg && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{securityMsg}</p>}
                </form>
              )}

              {tab === 'sessions' && (
                <div>
                  {sessionsError ? (
                    <p role="alert" className="border-l-2 border-rose-400 bg-rose-50 px-4 py-3 text-sm text-rose-800">{sessionsError}</p>
                  ) : !sessions ? (
                    <div className="space-y-3" aria-label="Loading">
                      {[0, 1].map((i) => <div key={i} className="h-14 animate-pulse rounded bg-brand-50" />)}
                    </div>
                  ) : sessions.length === 0 ? (
                    <p className="text-sm text-muted">No active sessions.</p>
                  ) : (
                    <ul className="divide-y divide-line border border-line">
                      {sessions.map((s) => (
                        <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3">
                          <div className="flex min-w-0 items-center gap-3">
                            {String(s.deviceType ?? '').toLowerCase() === 'desktop' ? (
                              <MonitorSmartphone size={18} aria-hidden="true" className="shrink-0 text-brand-700" />
                            ) : (
                              <Smartphone size={18} aria-hidden="true" className="shrink-0 text-muted" />
                            )}
                            <div className="min-w-0">
                            <p className="flex items-center gap-2 text-sm font-bold">
                              {s.deviceName || s.deviceType}
                              {String(s.deviceType ?? '').toLowerCase() === 'desktop' && (
                                <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-brand-700">Desktop app</span>
                              )}
                            </p>
                            <p className="text-xs text-muted">Last used {new Date(s.lastUsedAt).toLocaleString()}</p>
                            </div>
                          </div>
                          <button type="button" onClick={() => revokeSession(s.id)} className="shrink-0 rounded border border-line px-3 py-1.5 text-xs font-bold text-rose-700 hover:border-rose-300">
                            Revoke
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-3 text-xs text-muted">Revoking a session signs that device out immediately.</p>
                </div>
              )}

              {tab === 'preferences' && (
                <ul className="space-y-3">
                  {PREF_DEFS.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 border border-line p-4">
                      <div>
                        <p className="text-sm font-bold">{p.label}</p>
                        <p className="text-xs text-muted">{p.hint}</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={prefs[p.id]}
                        aria-label={p.label}
                        onClick={() => togglePref(p.id)}
                        className={`inline-flex h-6 w-11 shrink-0 items-center rounded-full px-1 transition-colors ${prefs[p.id] ? 'bg-brand-500' : 'bg-line'}`}
                      >
                        <span className={`h-4 w-4 rounded-full bg-white transition-transform ${prefs[p.id] ? 'translate-x-5' : ''}`} />
                      </button>
                    </li>
                  ))}
                  <p className="text-xs text-muted">Saved on this device only.</p>
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
