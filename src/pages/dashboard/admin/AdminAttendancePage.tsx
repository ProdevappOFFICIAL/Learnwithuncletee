import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardHead,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
  Pagination,
  Pill,
  TableWrap,
  Td,
  Th,
} from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { apiDelete, apiGet, apiPost } from '@/lib/api';
import { usePagedList } from '@/lib/pagedQuery';
import type { ClassItem } from '@/data/dashboard';
import { LogIn, LogOut, Undo2 } from 'lucide-react';

interface RegisterRow {
  id: string;
  user_name: string;
  user_email: string;
  role: string;
  active: boolean;
  classId?: string | null;
  img?: string | null;
  student?: { studentCode: string; className: string; photoUrl?: string | null } | null;
  teacher?: { staffCode: string; photoUrl?: string | null } | null;
  record: { checkInAt: string | null; checkOutAt: string | null } | null;
  status: 'ABSENT' | 'IN' | 'OUT';
}

const dayString = (d: Date, tz = 'Africa/Lagos') =>
  d.toLocaleDateString('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });

const timeOf = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

const initialsOf = (name: string) =>
  name.split(' ').map((p) => p.replace('.', '')[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'LW';

const PersonPhoto = ({ row }: { row: RegisterRow }) => {
  const src = row.student?.photoUrl || row.teacher?.photoUrl || row.img || null;
  if (src) return <img src={src} alt="" className="h-9 w-9 shrink-0 rounded-full border border-line object-cover" />;
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-900 text-[11px] font-extrabold text-lime-accent">
      {initialsOf(row.user_name)}
    </span>
  );
};

const statusTone = (s: RegisterRow['status']) => (s === 'OUT' ? 'emerald' : s === 'IN' ? 'sky' : 'rose');

type Tab = 'STUDENT' | 'STAFF';

export const AdminAttendancePage = () => {
  const [tab, setTab] = useState<Tab>('STUDENT');
  const [date, setDate] = useState(dayString(new Date()));
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  const classes = useResource<ClassItem[]>('/classes', { limit: 200 });
  const qc = useQueryClient();

  // Register turns over as colleagues mark from other devices: revalidate
  // after 60 s, keep 10 min of pages for instant back-navigation, prefetch
  // neighbours (shared hook), no focus refetch storms (global default).
  const register = usePagedList<RegisterRow>(
    ['attendance-register', date, query, classFilter, tab, statusFilter],
    (page, limit) =>
      apiGet<RegisterRow[]>('/attendance/register', {
        date,
        search: query || undefined,
        classId: tab === 'STUDENT' ? classFilter || undefined : undefined,
        role: tab,
        status: statusFilter || undefined,
        page,
        limit,
      }),
    { staleTime: 60 * 1000, gcTime: 10 * 60 * 1000 },
  );

  const act = async (row: RegisterRow, kind: 'in' | 'out' | 'unmark') => {
    if (kind === 'unmark' && !confirm(`Clear ${row.user_name}'s attendance for ${date}?`)) return;
    // Optimistic: flip the row instantly, roll back only if the server refuses.
    const pageKey = ['attendance-register', date, query, classFilter, tab, statusFilter, register.page, register.limit];
    const now = new Date().toISOString();
    const optimisticRow: RegisterRow =
      kind === 'in'
        ? { ...row, status: 'IN', record: { checkInAt: now, checkOutAt: null } }
        : kind === 'out'
          ? { ...row, status: 'OUT', record: { checkInAt: row.record?.checkInAt ?? now, checkOutAt: now } }
          : { ...row, status: 'ABSENT', record: null };
    const snapshot = qc.getQueryData<{ data: RegisterRow[] }>(pageKey);
    qc.setQueryData<{ data: RegisterRow[] }>(pageKey, (old) =>
      old ? { ...old, data: old.data.map((r) => (r.id === row.id ? optimisticRow : r)) } : old,
    );
    setRowBusy(row.id);
    setNotice(null);
    try {
      if (kind === 'in') {
        await apiPost('/attendance/register/check-in', { userId: row.id, date });
        setNotice(`${row.user_name} checked in at ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`);
      } else if (kind === 'out') {
        await apiPost('/attendance/register/check-out', { userId: row.id, date });
        setNotice(`${row.user_name} checked out.`);
      } else {
        await apiDelete(`/attendance/register/${row.id}?date=${date}`);
      }
      register.invalidate();
    } catch (err: any) {
      // Roll back the optimistic flip so the row shows the server truth.
      qc.setQueryData(pageKey, snapshot);
      setNotice(err?.message ?? 'Action failed');
    } finally {
      setRowBusy(null);
    }
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setClassFilter('');
    setStatusFilter('');
    register.resetPage();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Members"
        title="Attendance"
        text="Daily register — search a name, tap check-in, tap check-out later. Times are recorded automatically."
      />
      {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

      <Card>
        <CardHead title={`${tab === 'STUDENT' ? 'Pupil' : 'Staff'} register`} sub={`${register.total} shown · ${date}`} />
        <div className="flex flex-wrap items-end gap-2 border-b border-line px-5 py-4">
          <div className="flex gap-1 rounded border border-line p-1" role="group" aria-label="Register tab">
            {(['STUDENT', 'STAFF'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => switchTab(t)}
                aria-pressed={tab === t}
                className={`min-h-10 rounded px-4 py-1.5 text-xs font-bold ${tab === t ? 'bg-brand-900 text-white' : 'text-muted hover:text-ink'}`}
              >
                {t === 'STUDENT' ? 'Pupils' : 'Staff'}
              </button>
            ))}
          </div>
          <label className="block text-xs font-bold text-muted">
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); register.resetPage(); }}
              className="mt-1 block min-h-11 rounded border border-line bg-white px-3 text-sm font-semibold"
            />
          </label>
          <label className="block text-xs font-bold text-muted">
            {tab === 'STUDENT' ? 'Pupil' : 'Staff member'}
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email…"
              className="mt-1 block min-h-11 w-full min-w-44 rounded border border-line px-3 text-sm font-semibold outline-none focus:border-brand-500"
            />
          </label>
          {tab === 'STUDENT' && (
            <label className="block text-xs font-bold text-muted">
              Class
              <select value={classFilter} onChange={(e) => { setClassFilter(e.target.value); register.resetPage(); }} className="mt-1 block min-h-11 rounded border border-line bg-white px-3 text-sm font-semibold">
                <option value="">All classes</option>
                {(classes.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          )}
          <label className="block text-xs font-bold text-muted">
            Status
            <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); register.resetPage(); }} className="mt-1 block min-h-11 rounded border border-line bg-white px-3 text-sm font-semibold">
              <option value="">All</option>
              <option value="ABSENT">Absent</option>
              <option value="IN">Checked in</option>
              <option value="OUT">Checked out</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => { setQuery(search); register.resetPage(); }}
            className="min-h-11 rounded bg-brand-900 px-4 text-sm font-bold text-white hover:bg-brand-700"
          >
            Search
          </button>
          {(search || classFilter || statusFilter) && (
            <button type="button" onClick={() => { setSearch(''); setQuery(''); setClassFilter(''); setStatusFilter(''); register.resetPage(); }} className="min-h-11 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink">
              Reset
            </button>
          )}
        </div>

        {register.isPending ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={5} /></div>
        ) : register.isError ? (
          <div className="px-5 py-5"><ErrorState message="Could not load register" onRetry={() => register.refetch()} /></div>
        ) : register.rows.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message={query ? 'Nobody matches your search.' : 'Nobody on the register yet.'} /></div>
        ) : (
          <>
            <TableWrap>
              <table className={`w-full min-w-[760px] text-left text-sm transition-opacity ${register.isFetching ? 'opacity-60' : ''}`}>
                <thead>
                  <tr>
                    <Th>Name</Th>
                    <Th>{tab === 'STUDENT' ? 'Class' : 'Role'}</Th>
                    <Th>Check-in</Th>
                    <Th>Check-out</Th>
                    <Th>Status</Th>
                    <Th><span className="sr-only">Mark</span></Th>
                  </tr>
                </thead>
                <tbody>
                  {register.rows.map((r) => (
                    <tr key={r.id}>
                      <Td>
                        <span className="flex items-center gap-2.5">
                          <PersonPhoto row={r} />
                          <span>
                            <span className="block font-bold">{r.user_name}</span>
                            <span className="block text-xs text-muted">{r.student?.studentCode ?? r.teacher?.staffCode ?? r.user_email}</span>
                          </span>
                        </span>
                      </Td>
                      <Td className="text-muted">{tab === 'STUDENT' ? (r.student?.className ?? '—') : r.role.charAt(0) + r.role.slice(1).toLowerCase()}</Td>
                      <Td className="font-semibold">{timeOf(r.record?.checkInAt ?? null)}</Td>
                      <Td className="font-semibold">{timeOf(r.record?.checkOutAt ?? null)}</Td>
                      <Td><Pill tone={statusTone(r.status)}>{r.status === 'IN' ? 'Checked in' : r.status === 'OUT' ? 'Checked out' : 'Absent'}</Pill></Td>
                      <Td>
                        <span className="flex gap-1.5">
                          {r.status === 'ABSENT' && (
                            <button type="button" disabled={rowBusy === r.id} onClick={() => act(r, 'in')} className="inline-flex items-center gap-1.5 rounded bg-brand-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-60">
                              <LogIn aria-hidden="true" size={14} /> Check in
                            </button>
                          )}
                          {r.status === 'IN' && (
                            <button type="button" disabled={rowBusy === r.id} onClick={() => act(r, 'out')} className="inline-flex items-center gap-1.5 rounded bg-brand-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-60">
                              <LogOut aria-hidden="true" size={14} /> Check out
                            </button>
                          )}
                          {r.status !== 'ABSENT' && (
                            <button type="button" disabled={rowBusy === r.id} onClick={() => act(r, 'unmark')} title="Clear this day" aria-label={`Clear ${r.user_name}'s attendance`} className="rounded border border-line px-2.5 py-2 text-xs font-bold text-muted hover:border-rose-300 hover:text-rose-700 disabled:opacity-60">
                              <Undo2 aria-hidden="true" size={14} />
                            </button>
                          )}
                        </span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
            <Pagination
              total={register.total}
              page={register.page}
              pageCount={register.pageCount}
              limit={register.limit}
              onPage={register.setPage}
              onLimit={register.setLimit}
              disabled={register.isFetching}
              noun="people"
            />
          </>
        )}
      </Card>
    </div>
  );
};
