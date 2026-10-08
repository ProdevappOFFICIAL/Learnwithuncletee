import { Fragment, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardHead,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
  Pagination,
  TableWrap,
  Td,
  Th,
} from '@/components/dashboard/DashboardUI';
import { apiGet } from '@/lib/api';
import { usePagedList } from '@/lib/pagedQuery';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface AuditLogRow {
  id: string;
  action: string;
  description: string;
  createdAt: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  method?: string | null;
  path?: string | null;
  metadata?: Record<string, any> | null;
  user: { user_name: string; user_email?: string; role: string } | null;
}

const ROLES = ['OWNER', 'ADMIN', 'TEACHER', 'BURSAR', 'STUDENT', 'PARENT'];

const roleTone = (role?: string) =>
  role === 'ADMIN' || role === 'OWNER'
    ? 'bg-brand-900 text-white'
    : role === 'TEACHER'
      ? 'bg-brand-50 text-brand-700'
      : 'bg-cream text-muted';

export const AdminAuditLogPage = () => {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('');
  const [action, setAction] = useState('');
  const [timeRange, setTimeRange] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  // Action codes are near-static — cache long, refetch rarely.
  const actionCodes = useQuery({
    queryKey: ['audit-actions'],
    queryFn: () => apiGet<string[]>('/audits/actions'),
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });

  const logs = usePagedList<AuditLogRow>(
    ['audit-log', query, role, action, timeRange],
    (page, limit) =>
      apiGet<AuditLogRow[]>('/audits', {
        search: query || undefined,
        role: role || undefined,
        action: action || undefined,
        timeRange: timeRange || undefined,
        page,
        limit,
      }),
  );

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(search);
    logs.resetPage();
  };

  const resetFilters = () => {
    setSearch('');
    setQuery('');
    setRole('');
    setAction('');
    setTimeRange('');
    logs.resetPage();
  };

  const inputClass =
    'min-h-11 rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Audit Log"
        text="Every recorded action across the workspace — who did what, from where, and when."
      />

      <Card>
        <CardHead title="Activity" sub={logs.total ? `${logs.total} entr${logs.total === 1 ? 'y' : 'ies'} found` : undefined} />
        <form onSubmit={applyFilters} className="flex flex-wrap items-end gap-2 border-b border-line px-5 py-4">
          <label className="block text-xs font-bold text-muted">
            Search
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Actor, action, IP or details…"
              className={`${inputClass} mt-1 w-full min-w-52`}
            />
          </label>
          <label className="block text-xs font-bold text-muted">
            Role
            <select value={role} onChange={(e) => { setRole(e.target.value); logs.resetPage(); }} className={`${inputClass} mt-1 font-semibold`}>
              <option value="">All roles</option>
              {ROLES.map((r) => <option key={r} value={r}>{r.charAt(0) + r.slice(1).toLowerCase()}</option>)}
            </select>
          </label>
          <label className="block text-xs font-bold text-muted">
            Action
            <select value={action} onChange={(e) => { setAction(e.target.value); logs.resetPage(); }} className={`${inputClass} mt-1 min-w-40 font-mono`}>
              <option value="">All actions</option>
              {(actionCodes.data?.data ?? []).map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </label>
          <label className="block text-xs font-bold text-muted">
            Period
            <select value={timeRange} onChange={(e) => { setTimeRange(e.target.value); logs.resetPage(); }} className={`${inputClass} mt-1 font-semibold`}>
              <option value="">All time</option>
              <option value="today">Today</option>
              <option value="this_week">This week</option>
              <option value="last_week">Last week</option>
            </select>
          </label>
          <button
            type="submit"
            className="min-h-11 rounded bg-brand-900 px-4 text-sm font-bold text-white hover:bg-brand-700"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={resetFilters}
            className="min-h-11 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink"
          >
            Reset
          </button>
        </form>

        {logs.isPending ? (
          <div className="px-5 py-5">
            <LoadingSkeleton rows={5} />
          </div>
        ) : logs.isError ? (
          <div className="px-5 py-5">
            <ErrorState message="Could not load activity" onRetry={() => logs.refetch()} />
          </div>
        ) : logs.rows.length === 0 ? (
          <div className="px-5 py-5">
            <EmptyState message="No activity matches these filters." />
          </div>
        ) : (
          <>
            <TableWrap>
              <table className={`w-full min-w-[840px] text-left text-sm transition-opacity ${logs.isFetching ? 'opacity-60' : ''}`}>
                <thead>
                  <tr>
                    <Th>Time</Th>
                    <Th>Actor</Th>
                    <Th>Role</Th>
                    <Th>Action</Th>
                    <Th>IP</Th>
                    <Th>Details</Th>
                    <Th><span className="sr-only">Expand</span></Th>
                  </tr>
                </thead>
                <tbody>
                  {logs.rows.map((log) => {
                    const open = expanded === log.id;
                    return (
                      <Fragment key={log.id}>
                        <tr>
                          <Td className="whitespace-nowrap text-muted">
                            {new Date(log.createdAt).toLocaleString()}
                          </Td>
                          <Td className="font-semibold">{log.user?.user_name ?? 'System'}</Td>
                          <Td>
                            <span
                              className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${roleTone(log.user?.role)}`}
                            >
                              {log.user?.role ?? '—'}
                            </span>
                          </Td>
                          <Td>
                            <code className="rounded bg-cream px-2 py-0.5 font-mono text-xs font-bold text-brand-700">
                              {log.action}
                            </code>
                          </Td>
                          <Td className="font-mono text-xs text-muted">{log.ipAddress ?? '—'}</Td>
                          <Td className="max-w-md truncate text-muted"><span title={log.description}>{log.description}</span></Td>
                          <Td>
                            <button
                              type="button"
                              onClick={() => setExpanded(open ? null : log.id)}
                              aria-expanded={open}
                              aria-label={open ? 'Hide full context' : 'Show full context'}
                              className="rounded border border-line px-2.5 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700"
                            >
                              {open ? <ChevronDown aria-hidden="true" size={14} /> : <ChevronRight aria-hidden="true" size={14} />}
                            </button>
                          </Td>
                        </tr>
                        {open && (
                          <tr>
                            <td colSpan={7} className="border-t border-line bg-cream/60 px-5 py-4">
                              <dl className="grid gap-2 text-xs sm:grid-cols-2">
                                <div><dt className="font-bold uppercase tracking-widest text-muted">Email</dt><dd className="mt-0.5 font-mono">{log.user?.user_email ?? '—'}</dd></div>
                                <div><dt className="font-bold uppercase tracking-widest text-muted">IP address</dt><dd className="mt-0.5 font-mono">{log.ipAddress ?? '—'}</dd></div>
                                <div className="sm:col-span-2"><dt className="font-bold uppercase tracking-widest text-muted">Device</dt><dd className="mt-0.5 break-all font-mono text-muted">{log.userAgent ?? '—'}</dd></div>
                                <div><dt className="font-bold uppercase tracking-widest text-muted">Request</dt><dd className="mt-0.5 font-mono">{[log.method, log.path].filter(Boolean).join(' ') || '—'}</dd></div>
                                <div><dt className="font-bold uppercase tracking-widest text-muted">Full description</dt><dd className="mt-0.5">{log.description}</dd></div>
                                {log.metadata && (
                                  <div className="sm:col-span-2">
                                    <dt className="font-bold uppercase tracking-widest text-muted">Metadata</dt>
                                    <dd className="mt-0.5 overflow-x-auto rounded border border-line bg-white p-2 font-mono text-[11px]">{JSON.stringify(log.metadata, null, 2)}</dd>
                                  </div>
                                )}
                              </dl>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>
            <Pagination
              total={logs.total}
              page={logs.page}
              pageCount={logs.pageCount}
              limit={logs.limit}
              onPage={logs.setPage}
              onLimit={logs.setLimit}
              disabled={logs.isFetching}
              noun="entr(y/ies)"
            />
          </>
        )}
      </Card>
    </div>
  );
};
