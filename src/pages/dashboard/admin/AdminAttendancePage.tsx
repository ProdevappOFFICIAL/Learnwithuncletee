import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardHead,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  Modal,
  PageHeader,
  Pagination,
  Pill,
  TableWrap,
  Td,
  Th,
} from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { API_BASE, apiDelete, apiGet, apiPost, tokenStore } from '@/lib/api';
import { usePagedList } from '@/lib/pagedQuery';
import type { ClassItem } from '@/data/dashboard';
import { Download, LogIn, LogOut, Undo2 } from 'lucide-react';

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

/** Shape of every cached register page, so optimistic edits can touch them all. */
interface RegisterPage {
  data: RegisterRow[];
  meta?: { total: number; page: number; limit: number };
}

type Notice = { text: string; tone: 'ok' | 'error' };

export const AdminAttendancePage = () => {
  const [tab, setTab] = useState<Tab>('STUDENT');
  const [date, setDate] = useState(dayString(new Date()));
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [pendingIds, setPendingIds] = useState<string[]>([]);

  // Excel export dialog (server-generated .xlsx).
  const [exportOpen, setExportOpen] = useState(false);
  const [exportMode, setExportMode] = useState<'month' | 'range'>('month');
  const [exportMonth, setExportMonth] = useState(dayString(new Date()).slice(0, 7));
  const [exportFrom, setExportFrom] = useState(dayString(new Date()));
  const [exportTo, setExportTo] = useState(dayString(new Date()));
  const [exportClass, setExportClass] = useState('');
  const [exportBusy, setExportBusy] = useState(false);

  const openExport = () => {
    setExportClass(tab === 'STUDENT' ? classFilter : '');
    setExportOpen(true);
  };

  const runExport = async () => {
    setExportBusy(true);
    try {
      const params = new URLSearchParams({ role: tab });
      if (exportMode === 'month') {
        if (!exportMonth) throw new Error('Pick a month first.');
        params.set('month', exportMonth);
      } else {
        if (!exportFrom || !exportTo) throw new Error('Pick both dates first.');
        params.set('from', exportFrom);
        params.set('to', exportTo);
      }
      if (tab === 'STUDENT' && exportClass) params.set('classId', exportClass);
      const token = tokenStore.get();
      const res = await fetch(`${API_BASE}/attendance/register/export?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
      });
      const contentType = res.headers.get('content-type') ?? '';
      if (!res.ok || contentType.includes('application/json')) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.message ?? `Export failed (${res.status})`);
      }
      const blob = await res.blob();
      const disposition = res.headers.get('content-disposition') ?? '';
      const filename = disposition.match(/filename="([^"]+)"/)?.[1]
        ?? `attendance-${tab === 'STUDENT' ? 'pupils' : 'staff'}.xlsx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setExportOpen(false);
      setNotice({ text: 'Excel file downloaded.', tone: 'ok' });
    } catch (err: any) {
      setNotice({ text: err?.message ?? 'Export failed', tone: 'error' });
    } finally {
      setExportBusy(false);
    }
  };

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

  // Typing searches as you type — the request runs in the background while the
  // current rows stay on screen (keepPreviousData), so the page never blanks.
  const debouncedSearch = search.trim();
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(debouncedSearch);
      register.setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // Auto-dismiss confirmations; errors stay a little longer so they can be read.
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), notice.tone === 'error' ? 7000 : 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const act = async (row: RegisterRow, kind: 'in' | 'out' | 'unmark') => {
    if (pendingIds.includes(row.id)) return;
    if (kind === 'unmark' && !confirm(`Clear ${row.user_name}'s attendance for ${date}?`)) return;

    const prefix = ['attendance-register', date];
    setPendingIds((prev) => [...prev, row.id]);
    setNotice(null);

    // Stop any background refresh for this date before editing the cache, so a
    // slow response can't overwrite the optimistic row while the write is in flight.
    await qc.cancelQueries({ queryKey: prefix });

    // Optimistic: write the new row into every cached page for this date, so the
    // change is already visible when the user navigates or switches filters.
    const snapshots = qc.getQueriesData<RegisterPage>({ queryKey: prefix });
    const now = new Date();
    const optimisticRow: RegisterRow =
      kind === 'in'
        ? { ...row, status: 'IN', record: { checkInAt: now.toISOString(), checkOutAt: null } }
        : kind === 'out'
          ? { ...row, status: 'OUT', record: { checkInAt: row.record?.checkInAt ?? now.toISOString(), checkOutAt: now.toISOString() } }
          : { ...row, status: 'ABSENT', record: null };

    for (const [key, page] of snapshots) {
      if (!page || !page.data.some((r) => r.id === row.id)) continue;
      // If this cached page is filtered by status, and the new status no longer
      // matches, drop the row now instead of waiting for the refetch.
      const pageStatus = String(key[5] ?? '');
      const leavesFilter = pageStatus !== '' && pageStatus !== optimisticRow.status;
      const data = leavesFilter
        ? page.data.filter((r) => r.id !== row.id)
        : page.data.map((r) => (r.id === row.id ? optimisticRow : r));
      qc.setQueryData<RegisterPage>(key, {
        ...page,
        data,
        meta: leavesFilter && page.meta
          ? { ...page.meta, total: Math.max(0, page.meta.total - 1) }
          : page.meta,
      });
    }

    const clock = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setNotice({
      text: kind === 'in'
        ? `${row.user_name} checked in at ${clock}.`
        : kind === 'out'
          ? `${row.user_name} checked out at ${clock}.`
          : `Cleared ${row.user_name}'s attendance for ${date}.`,
      tone: 'ok',
    });

    try {
      if (kind === 'in') {
        await apiPost('/attendance/register/check-in', { userId: row.id, date });
      } else if (kind === 'out') {
        await apiPost('/attendance/register/check-out', { userId: row.id, date });
      } else {
        await apiDelete(`/attendance/register/${row.id}?date=${date}`);
      }
      // Confirm with the server in the background — no blocking spinner, no
      // dimming; the optimistic rows stay interactive while this runs.
      void qc.invalidateQueries({ queryKey: prefix, refetchType: 'active' });
    } catch (err: any) {
      // Roll back every optimistic page so the UI matches the server again.
      for (const [key, page] of snapshots) {
        if (page) qc.setQueryData(key, page);
      }
      setNotice({ text: err?.message ?? 'Action failed', tone: 'error' });
    } finally {
      setPendingIds((prev) => prev.filter((id) => id !== row.id));
    }
  };

  const switchTab = (t: Tab) => {
    setTab(t);
    setClassFilter('');
    setStatusFilter('');
    register.resetPage();
  };

  // Hovering a tab warms its first page, so the switch paints instantly.
  const prefetchTab = (next: Tab) => {
    if (next === tab) return;
    void qc.prefetchQuery({
      queryKey: ['attendance-register', date, query, '', next, '', 1, register.limit],
      queryFn: () =>
        apiGet<RegisterRow[]>('/attendance/register', {
          date,
          search: query || undefined,
          role: next,
          page: 1,
          limit: register.limit,
        }),
      staleTime: 60 * 1000,
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Members"
        title="Attendance"
        text="Daily register — search a name, tap check-in, tap check-out later. Times are recorded automatically."
        actions={
          <button type="button" onClick={openExport} className="inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
            <Download aria-hidden="true" size={16} className="mr-2" /> Export Excel
          </button>
        }
      />
      {notice && (
        <p
          role="status"
          aria-live="polite"
          className={`border-l-2 px-4 py-3 text-sm ${
            notice.tone === 'error'
              ? 'border-rose-400 bg-rose-50 text-rose-800'
              : 'border-lime-accent bg-brand-50 text-brand-800'
          }`}
        >
          {notice.text}
        </p>
      )}

      <Card>
        <CardHead
          title={`${tab === 'STUDENT' ? 'Pupil' : 'Staff'} register`}
          sub={`${register.total} shown · ${date}${register.isFetching && !register.isPending ? ' · updating…' : ''}`}
        />
        <div className="flex flex-wrap items-end gap-2 border-b border-line px-5 py-4">
          <div className="flex gap-1 rounded border border-line p-1" role="group" aria-label="Register tab">
            {(['STUDENT', 'STAFF'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => switchTab(t)}
                onMouseEnter={() => prefetchTab(t)}
                onFocus={() => prefetchTab(t)}
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  setQuery(search.trim());
                  register.setPage(1);
                }
              }}
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
            onClick={() => { setQuery(search.trim()); register.resetPage(); }}
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

        {register.isError && register.rows.length > 0 && (
          <div role="alert" className="flex flex-wrap items-center gap-2 border-b border-rose-200 bg-rose-50 px-5 py-2.5 text-xs text-rose-800">
            <span>Couldn't refresh the register — showing the last known rows.</span>
            <button
              type="button"
              onClick={() => register.refetch()}
              className="font-bold underline underline-offset-2 hover:text-rose-900"
            >
              Retry
            </button>
          </div>
        )}

        {register.isPending ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={5} /></div>
        ) : register.isError && register.rows.length === 0 ? (
          <div className="px-5 py-5"><ErrorState message="Could not load register" onRetry={() => register.refetch()} /></div>
        ) : register.rows.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message={query ? 'Nobody matches your search.' : 'Nobody on the register yet.'} /></div>
        ) : (
          <>
            <TableWrap>
              <table className="w-full min-w-[760px] text-left text-sm">
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
                    <tr key={r.id} aria-busy={register.isPlaceholderData || pendingIds.includes(r.id)}>
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
                            <button type="button" disabled={register.isPlaceholderData || pendingIds.includes(r.id)} onClick={() => act(r, 'in')} className="inline-flex items-center gap-1.5 rounded bg-brand-500 px-3.5 py-2 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-60">
                              <LogIn aria-hidden="true" size={14} /> Check in
                            </button>
                          )}
                          {r.status === 'IN' && (
                            <button type="button" disabled={register.isPlaceholderData || pendingIds.includes(r.id)} onClick={() => act(r, 'out')} className="inline-flex items-center gap-1.5 rounded bg-brand-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-60">
                              <LogOut aria-hidden="true" size={14} /> Check out
                            </button>
                          )}
                          {r.status !== 'ABSENT' && (
                            <button type="button" disabled={register.isPlaceholderData || pendingIds.includes(r.id)} onClick={() => act(r, 'unmark')} title="Clear this day" aria-label={`Clear ${r.user_name}'s attendance`} className="rounded border border-line px-2.5 py-2 text-xs font-bold text-muted hover:border-rose-300 hover:text-rose-700 disabled:opacity-60">
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
              disabled={register.isPending}
              noun="people"
            />
          </>
        )}
      </Card>

      <Modal open={exportOpen} onClose={() => setExportOpen(false)} title={`Export ${tab === 'STUDENT' ? 'pupil' : 'staff'} register`}>
        <div className="space-y-4">
          <p className="text-sm text-muted">The Excel file is generated on the server — one row per person, one column per day, plus present/absent totals.</p>
          <div className="flex gap-1 rounded border border-line p-1" role="group" aria-label="Export range">
            {(['month', 'range'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setExportMode(m)}
                aria-pressed={exportMode === m}
                className={`min-h-10 flex-1 rounded px-4 py-1.5 text-xs font-bold ${exportMode === m ? 'bg-brand-900 text-white' : 'text-muted hover:text-ink'}`}
              >
                {m === 'month' ? 'Whole month' : 'Date range'}
              </button>
            ))}
          </div>
          {exportMode === 'month' ? (
            <label className="block text-sm font-semibold">Month
              <input
                type="month"
                value={exportMonth}
                onChange={(e) => setExportMonth(e.target.value)}
                className="mt-2 block min-h-11 rounded border border-line bg-white px-3 text-sm font-semibold outline-none focus:border-brand-500"
              />
            </label>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold">From
                <input
                  type="date"
                  value={exportFrom}
                  max={exportTo}
                  onChange={(e) => setExportFrom(e.target.value)}
                  className="mt-2 block min-h-11 w-full rounded border border-line bg-white px-3 text-sm font-semibold outline-none focus:border-brand-500"
                />
              </label>
              <label className="block text-sm font-semibold">To (max 31 days)
                <input
                  type="date"
                  value={exportTo}
                  min={exportFrom}
                  onChange={(e) => setExportTo(e.target.value)}
                  className="mt-2 block min-h-11 w-full rounded border border-line bg-white px-3 text-sm font-semibold outline-none focus:border-brand-500"
                />
              </label>
            </div>
          )}
          {tab === 'STUDENT' && (
            <label className="block text-sm font-semibold">Class
              <select value={exportClass} onChange={(e) => setExportClass(e.target.value)} className="mt-2 block min-h-11 w-full rounded border border-line bg-white px-3 text-sm font-semibold">
                <option value="">All classes</option>
                {(classes.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={() => setExportOpen(false)} className="min-h-11 flex-1 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink">
              Cancel
            </button>
            <button type="button" onClick={runExport} disabled={exportBusy} className="inline-flex min-h-11 flex-1 items-center justify-center rounded bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
              <Download aria-hidden="true" size={16} className="mr-2" />{exportBusy ? 'Preparing…' : 'Download Excel'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
