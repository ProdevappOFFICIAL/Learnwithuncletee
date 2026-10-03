import { useState } from 'react';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pill, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { apiPost } from '@/lib/api';
import type { StaffRow } from '@/data/dashboard';

const SUBJECT_CHOICES = ['Mathematics', 'English Language', 'Basic Science', 'Social Studies', 'ICT', 'Civic Education'];

export const AdminTeachersPage = () => {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const { data, loading, error, reload } = useResource<StaffRow[]>('/staff', { search: query, limit: 50 });
  const [form, setForm] = useState({ user_name: '', user_email: '', password: '', department: '', subjects: 'Mathematics' });
  const [created, setCreated] = useState<{ email: string; password: string; staffCode: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    setCreated(null);
    try {
      const res = await apiPost<{ login: { email: string; password: string }; profile: { staffCode: string } }>('/staff', {
        user_name: form.user_name,
        user_email: form.user_email,
        password: form.password || undefined,
        department: form.department || undefined,
        subjects: form.subjects.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setCreated({ email: res.data.login.email, password: res.data.login.password, staffCode: res.data.profile.staffCode });
      setForm({ user_name: '', user_email: '', password: '', department: '', subjects: 'Mathematics' });
      reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Could not create teacher');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Teachers & staff"
        title="Teachers & staff"
        text="Roles, departments, subjects and account status."
      />

      <Card className="p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Add teacher</p>
        <h3 className="mt-2 font-display text-lg font-extrabold">New teacher + login details</h3>
        <p className="mt-1 text-sm text-muted">Leave the password blank to auto-generate one. Share the login box with the teacher — it is shown only once.</p>
        <form onSubmit={create} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-sm font-semibold">Full name<input required value={form.user_name} onChange={(e) => setForm({ ...form, user_name: e.target.value })} className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm" /></label>
          <label className="block text-sm font-semibold">Email (login)<input required type="email" value={form.user_email} onChange={(e) => setForm({ ...form, user_email: e.target.value })} className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm" /></label>
          <label className="block text-sm font-semibold">Password (optional)<input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Auto-generate" className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm" /></label>
          <label className="block text-sm font-semibold">Department<input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Sciences" className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm" /></label>
          <label className="block text-sm font-semibold sm:col-span-2">Subjects (comma separated)<input value={form.subjects} onChange={(e) => setForm({ ...form, subjects: e.target.value })} placeholder={SUBJECT_CHOICES.slice(0, 3).join(', ')} className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm" /></label>
          <div className="sm:col-span-2 lg:col-span-3">
            <button type="submit" disabled={busy} className="min-h-11 w-full rounded bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
              {busy ? 'Creating…' : '+ Add teacher'}
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
              <li>Staff ID: <b>{created.staffCode}</b></li>
            </ul>
          </div>
        )}
      </Card>

      <Card>
        <CardHead title="Staff directory" sub="Assignments and status" />
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
          <div className="px-5 py-5"><EmptyState message="No staff found." /></div>
        ) : (
          <TableWrap>
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead><tr><Th>Staff</Th><Th>Role</Th><Th>Department / Subjects</Th><Th>Status</Th></tr></thead>
              <tbody>
                {data.map((s) => (
                  <tr key={s.id}>
                    <Td><span className="font-bold">{s.user_name}</span><span className="block text-xs text-muted">{s.user_email}{s.teacherProfile ? ` · ${s.teacherProfile.staffCode}` : ''}</span></Td>
                    <Td><Pill tone="ink">{s.role}</Pill></Td>
                    <Td className="text-muted">{s.teacherProfile?.department ?? '—'}{s.teacherProfile?.subjects?.length ? ` · ${s.teacherProfile.subjects.join(', ')}` : ''}</Td>
                    <Td><Pill tone={s.active ? 'emerald' : 'rose'}>{s.active ? 'Active' : 'Inactive'}</Pill></Td>
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
