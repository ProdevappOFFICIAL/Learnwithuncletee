import { useState } from 'react';
import {
  Card,
  CardHead,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
  TableWrap,
  Td,
  Th,
} from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';

interface AuditLogRow {
  id: string;
  action: string;
  description: string;
  createdAt: string;
  user: { user_name: string; role: string } | null;
}

const roleTone = (role?: string) =>
  role === 'ADMIN' || role === 'OWNER'
    ? 'bg-brand-900 text-white'
    : role === 'TEACHER'
      ? 'bg-brand-50 text-brand-700'
      : 'bg-cream text-muted';

export const AdminAuditLogPage = () => {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [action, setAction] = useState('');
  const [timeRange, setTimeRange] = useState('');
  const [page, setPage] = useState(1);

  const { data, meta, loading, error, reload } = useResource<AuditLogRow[]>('/audits', {
    search: search || undefined,
    role: role || undefined,
    action: action.trim() || undefined,
    timeRange: timeRange || undefined,
    page,
    limit: 20,
  });

  const total: number = meta?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    reload();
  };

  const resetFilters = () => {
    setSearch('');
    setRole('');
    setAction('');
    setTimeRange('');
    setPage(1);
  };

  const inputClass =
    'min-h-11 rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Audit Log"
        text="Every recorded action across the workspace — who did what, and when."
      />

      <Card>
        <CardHead title="Activity" sub={total ? `${total} entr${total === 1 ? 'y' : 'ies'} found` : undefined} />
        <form onSubmit={applyFilters} className="flex flex-wrap items-end gap-2 border-b border-line px-5 py-4">
          <label className="block text-xs font-bold text-muted">
            Search
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Actor, action or details…"
              className={`${inputClass} mt-1 w-full min-w-52`}
            />
          </label>
          <label className="block text-xs font-bold text-muted">
            Role
            <select value={role} onChange={(e) => setRole(e.target.value)} className={`${inputClass} mt-1 font-semibold`}>
              <option value="">All roles</option>
              <option value="ADMIN">Admin</option>
              <option value="TEACHER">Teacher</option>
            </select>
          </label>
          <label className="block text-xs font-bold text-muted">
            Action
            <input
              value={action}
              onChange={(e) => setAction(e.target.value)}
              placeholder="e.g. EXAM_CREATED"
              className={`${inputClass} mt-1 w-full min-w-40 font-mono`}
            />
          </label>
          <label className="block text-xs font-bold text-muted">
            Period
            <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} className={`${inputClass} mt-1 font-semibold`}>
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

        {loading ? (
          <div className="px-5 py-5">
            <LoadingSkeleton rows={5} />
          </div>
        ) : error || !data ? (
          <div className="px-5 py-5">
            <ErrorState message={error ?? 'No data'} onRetry={reload} />
          </div>
        ) : data.length === 0 ? (
          <div className="px-5 py-5">
            <EmptyState message="No activity matches these filters." />
          </div>
        ) : (
          <>
            <TableWrap>
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr>
                    <Th>Time</Th>
                    <Th>Actor</Th>
                    <Th>Role</Th>
                    <Th>Action</Th>
                    <Th>Details</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((log) => (
                    <tr key={log.id}>
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
                      <Td className="max-w-md text-muted">{log.description}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
            <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4">
              <p className="text-xs text-muted">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="min-h-10 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="min-h-10 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
