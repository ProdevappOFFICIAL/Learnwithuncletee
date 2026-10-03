import { useState } from 'react';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pill, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';
import { useAuth, useResource } from '@/context/AuthContext';
import { apiPost, formatNaira } from '@/lib/api';
import { CLASS_OPTIONS } from '@/data/dashboard';
import type { StudentRow } from '@/data/dashboard';

interface PendingUser {
  id: string;
  user_name: string;
  user_email: string;
  role: string;
  active: boolean;
  createdAt: string;
}

const PendingApprovals = () => {
  const { can } = useAuth();
  const { data, loading, reload } = useResource<PendingUser[]>('/users', { limit: 100 });
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  if (!can('users.write')) return null;
  const pending = (data ?? []).filter((u) => !u.active);

  const approve = async (id: string, name: string) => {
    setBusy(id);
    setNotice(null);
    try {
      await apiPost(`/users/${id}/approve`);
      setNotice(`${name} approved — they can now sign in.`);
      reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Approval failed');
    } finally {
      setBusy(null);
    }
  };

  if (loading || pending.length === 0) return null;

  return (
    <Card>
      <CardHead title="Pending approvals" sub={`${pending.length} account(s) waiting`} />
      {notice && <p role="status" className="border-b border-line bg-brand-50 px-5 py-3 text-sm text-brand-800">{notice}</p>}
      <ul className="divide-y divide-line">
        {pending.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
            <div>
              <p className="text-sm font-bold">{u.user_name} <Pill tone="amber">{u.role}</Pill></p>
              <p className="text-xs text-muted">{u.user_email} · registered {new Date(u.createdAt).toLocaleDateString()}</p>
            </div>
            <button
              type="button"
              disabled={busy === u.id}
              onClick={() => approve(u.id, u.user_name)}
              className="rounded bg-brand-500 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {busy === u.id ? 'Approving…' : 'Approve'}
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
};

export const AdminStudentsPage = () => {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const { data, loading, error, reload } = useResource<StudentRow[]>('/students', { search: query, limit: 50 });
  const [form, setForm] = useState({ user_name: '', user_email: '', password: '', className: 'JSS 2 Diamond', guardianName: '', guardianPhone: '' });
  const [created, setCreated] = useState<{ email: string; password: string; studentCode: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    setCreated(null);
    try {
      const res = await apiPost<{ login: { email: string; password: string }; profile: { studentCode: string } }>('/students', {
        ...form,
        password: form.password || undefined,
      });
      setCreated({ email: res.data.login.email, password: res.data.login.password, studentCode: res.data.profile.studentCode });
      setForm({ user_name: '', user_email: '', password: '', className: 'JSS 2 Diamond', guardianName: '', guardianPhone: '' });
      reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Could not create student');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Students"
        title="Students"
        text="Enrolment, class allocation, guardians and fee status across all programmes."
      />
      <PendingApprovals />

      <Card className="p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Add student</p>
        <h3 className="mt-2 font-display text-lg font-extrabold">New pupil + login details</h3>
        <p className="mt-1 text-sm text-muted">Leave the password blank to auto-generate one. Share the login box with the pupil/guardian — it is shown only once.</p>
        <form onSubmit={create} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm font-semibold">Full name<input required value={form.user_name} onChange={(e) => setForm({ ...form, user_name: e.target.value })} className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm" /></label>
          <label className="block text-sm font-semibold">Email (login)<input required type="email" value={form.user_email} onChange={(e) => setForm({ ...form, user_email: e.target.value })} className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm" /></label>
          <label className="block text-sm font-semibold">Password (optional)<input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Auto-generate" className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm" /></label>
          <label className="block text-sm font-semibold">Grade (class)
            <select value={form.className} onChange={(e) => setForm({ ...form, className: e.target.value })} className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm">
              {CLASS_OPTIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">Guardian name<input value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm" /></label>
          <label className="block text-sm font-semibold">Guardian phone<input value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} placeholder="+234…" className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm" /></label>
          <div className="sm:col-span-2 lg:col-span-3">
            <button type="submit" disabled={busy} className="min-h-11 w-full rounded bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
              {busy ? 'Creating…' : '+ Add student'}
            </button>
          </div>
        </form>
        {notice && <p role="alert" className="mt-4 border-l-2 border-rose-400 bg-rose-50 px-4 py-3 text-sm text-rose-800">{notice}</p>}
        {created && (
          <div role="status" className="mt-4 border border-lime-accent bg-brand-50 p-4 text-sm">
            <p className="font-extrabold text-brand-800">Account created — share these login details now (shown once):</p>
            <ul className="mt-2 space-y-1 font-mono text-[13px]">
              <li>Email: <b>{created.email}</b></li>
              <li>Password: <b>{created.password}</b></li>
              <li>Student ID: <b>{created.studentCode}</b></li>
            </ul>
          </div>
        )}
      </Card>

      <Card>
        <CardHead title="Student directory" sub="Search, filter and manage records" />
        <form
          className="flex flex-wrap gap-2 border-b border-line px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search);
          }}
        >
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email…" className="min-h-11 w-full max-w-xs rounded border border-line px-3 text-sm outline-none focus:border-brand-500" />
          <button type="submit" className="min-h-11 rounded bg-brand-900 px-4 text-sm font-bold text-white hover:bg-brand-700">Search</button>
        </form>
        {loading ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={5} /></div>
        ) : error || !data ? (
          <div className="px-5 py-5"><ErrorState message={error ?? 'No data'} onRetry={reload} /></div>
        ) : data.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message="No students found." /></div>
        ) : (
          <TableWrap>
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead><tr><Th>Pupil</Th><Th>Class</Th><Th>Guardian</Th><Th>Balance</Th><Th>Average</Th></tr></thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.id}>
                    <Td><span className="font-bold">{r.user_name}</span><span className="block text-xs text-muted">{r.studentProfile?.studentCode ?? r.user_email}</span></Td>
                    <Td>{r.studentProfile?.className ?? '—'}</Td>
                    <Td className="text-muted">{r.studentProfile?.guardianName ?? '—'}{r.studentProfile?.guardianPhone ? ` · ${r.studentProfile.guardianPhone}` : ''}</Td>
                    <Td>{(r.balanceKobo ?? 0) > 0 ? <Pill tone="amber">{formatNaira(r.balanceKobo)}</Pill> : <Pill tone="emerald">Clear</Pill>}</Td>
                    <Td className="font-bold text-brand-700">{r.average !== null && r.average !== undefined ? `${r.average.toFixed(1)}%` : '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>
    </div>
  );
};
