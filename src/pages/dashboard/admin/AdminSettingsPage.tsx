import { useState } from 'react';
import { Card, CardHead, ErrorState, LoadingSkeleton, PageHeader } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { apiPatch, apiPut } from '@/lib/api';

interface MatrixRow {
  key: string;
  label: string;
  module: string;
  roles: Record<string, boolean>;
}

const ROLES = ['BURSAR', 'TEACHER', 'STUDENT', 'PARENT'];

export const AdminSettingsPage = () => {
  const settings = useResource<Record<string, string>>('/settings');
  const matrix = useResource<{ permissions: unknown; matrix: MatrixRow[] }>('/permissions/matrix');
  const [draft, setDraft] = useState<Record<string, string> | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const values = draft ?? settings.data ?? {};

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      const res = await apiPatch<Record<string, string>>('/settings', values);
      settings.setData(res.data);
      setDraft(null);
      setNotice('School settings saved.');
    } catch (err: any) {
      setNotice(err?.message ?? 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const flip = async (role: string, key: string, current: boolean) => {
    setNotice(null);
    try {
      await apiPut('/permissions/matrix', { role, key, allowed: !current });
      matrix.reload();
      setNotice(`${role} ${!current ? 'granted' : 'denied'} ${key}. Sidebar and API update immediately.`);
    } catch (err: any) {
      setNotice(err?.message ?? 'Permission update failed');
    }
  };

  const set = (k: string, v: string) => setDraft({ ...values, [k]: v });
  const input = 'mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500';

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Control" title="Settings" text="School profile, session values and role permissions. Permission changes apply instantly." />
      {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

      <Card className="p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-700">School profile</p>
        <h3 className="mt-2 font-display text-lg font-extrabold">Identity, contacts & session</h3>
        {settings.loading ? (
          <div className="mt-4"><LoadingSkeleton rows={4} /></div>
        ) : settings.error || !settings.data ? (
          <div className="mt-4"><ErrorState message={settings.error ?? 'No data'} onRetry={settings.reload} /></div>
        ) : (
          <form className="mt-5 grid gap-4 sm:grid-cols-2" onSubmit={saveSettings}>
            {[
              ['school.name', 'School name'],
              ['school.address', 'Address'],
              ['school.phone', 'Phone'],
              ['school.email', 'Email'],
              ['session.current', 'Current session'],
              ['session.termDates', 'Term dates'],
              ['session.midtermBreak', 'Mid-term break'],
              ['grading.scale', 'Grading scale'],
            ].map(([k, label]) => (
              <label key={k} className="block text-sm font-semibold">{label}
                <input value={values[k] ?? ''} onChange={(e) => set(k, e.target.value)} className={input} />
              </label>
            ))}
            <div className="sm:col-span-2">
              <button type="submit" disabled={busy} className="min-h-11 w-full rounded bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
                {busy ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </form>
        )}
      </Card>

      <Card>
        <CardHead title="Roles & access" sub="Toggle what each role can see and do" />
        {matrix.loading ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={6} /></div>
        ) : matrix.error || !matrix.data ? (
          <div className="px-5 py-5"><ErrorState message={matrix.error ?? 'No data'} onRetry={matrix.reload} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr>
                  <th className="border-b border-line bg-brand-50/60 px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-brand-700">Permission</th>
                  {ROLES.map((r) => (
                    <th key={r} className="border-b border-line bg-brand-50/60 px-3 py-3 text-center text-[11px] font-bold uppercase tracking-widest text-brand-700">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.data.matrix.map((row) => (
                  <tr key={row.key}>
                    <td className="border-b border-line px-5 py-2.5">
                      <span className="font-bold">{row.label}</span>
                      <span className="block font-mono text-[11px] text-muted">{row.key}</span>
                    </td>
                    {ROLES.map((r) => (
                      <td key={r} className="border-b border-line px-3 py-2.5 text-center">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={row.roles[r]}
                          aria-label={`${r} ${row.key}`}
                          onClick={() => flip(r, row.key, row.roles[r])}
                          className={`inline-flex h-6 w-11 items-center rounded-full px-1 transition-colors ${row.roles[r] ? 'bg-brand-500' : 'bg-line'}`}
                        >
                          <span className={`h-4 w-4 rounded-full bg-white transition-transform ${row.roles[r] ? 'translate-x-5' : ''}`} />
                        </button>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="border-t border-line bg-brand-50/60 px-5 py-3 text-xs text-muted">OWNER and ADMIN always have full access and cannot be restricted. Denied sidebar items disappear on next navigation; denied API calls return 403.</p>
      </Card>
    </div>
  );
};
