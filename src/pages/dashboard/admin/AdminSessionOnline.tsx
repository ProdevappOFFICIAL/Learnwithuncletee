import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, CardHead, EmptyState, ErrorState, LoadingSkeleton,
  PageHeader, Pagination, Pill, TableWrap, Td, Th,
} from '@/components/dashboard/DashboardUI';
import { apiDelete, apiGet } from '@/lib/api';
import { usePagedList } from '@/lib/pagedQuery';
import { useResource } from '@/context/AuthContext';
import type { ClassItem } from '@/data/dashboard';
import { Clock, CheckCircle2, XCircle, Eye } from 'lucide-react';

interface SessionRow {
  id: string;
  userId: string;
  examId: string;
  submitted: boolean;
  marked: boolean;
  timeLeft?: number | null;
  overallScore?: number | null;
  startedAt?: string | null;
  lastActive?: string | null;
  lastAction?: string | null;
  currentQuestion?: number | null;
  user?: { id: string; user_name: string; user_email: string; class?: { name: string } | null };
  exam?: { id: string; exam_name: string; minutes: number };
  deployment?: { id: string; code: string } | null;
  createdAt: string;
}

const fmtTime = (secs?: number | null) => {
  if (secs == null) return '—';
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}m ${s}s`;
};

const actionLabel = (action?: string | null) => {
  if (!action) return '—';
  return action
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

export const AdminSessionOnline = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const classes = useResource<ClassItem[]>('/classes', { limit: 200 });

  const sessions = usePagedList<SessionRow>(
    ['online-sessions', query, classFilter],
    (page, limit) =>
      apiGet<SessionRow[]>('/exam-sessions/online', {
        searchTerm: query || undefined,
        classId: classFilter || undefined,
        page,
        limit,
      }),
  );

  const remove = async (row: SessionRow) => {
    if (!confirm(`Delete session for ${row.user?.user_name ?? 'this pupil'} on "${row.exam?.exam_name ?? 'this exam'}"? This cannot be undone.`)) return;
    try {
      await apiDelete(`/exam-sessions/online/${row.id}`);
      setNotice('Session deleted.');
      sessions.invalidate();
    } catch (err: any) {
      setNotice(err?.message ?? 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Exam & Test — Sessions"
        title="Online Sessions"
        text="Captures every student's exam sitting — including those who started but never submitted. Click a session to view their full question-by-question responses."
      />
      {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

      <Card>
        <CardHead title="All online sessions" sub={`${sessions.total} total`} />
        <form
          className="flex flex-wrap gap-2 border-b border-line px-5 py-4"
          onSubmit={(e) => { e.preventDefault(); setQuery(search); sessions.resetPage(); }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pupil or exam…"
            aria-label="Search sessions"
            className="min-h-11 w-full max-w-xs rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500"
          />
          <select
            value={classFilter}
            onChange={(e) => { setClassFilter(e.target.value); sessions.resetPage(); }}
            aria-label="Filter by class"
            className="min-h-11 rounded border border-line bg-white px-3 text-sm font-semibold"
          >
            <option value="">All classes</option>
            {(classes.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button type="submit" className="min-h-11 rounded bg-brand-900 px-4 text-sm font-bold text-white hover:bg-brand-700">Search</button>
          {(search || classFilter) && (
            <button type="button" onClick={() => { setSearch(''); setQuery(''); setClassFilter(''); sessions.resetPage(); }} className="min-h-11 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink">Reset</button>
          )}
        </form>

        {sessions.isPending ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={5} /></div>
        ) : sessions.isError ? (
          <div className="px-5 py-5"><ErrorState message="Could not load sessions" onRetry={() => sessions.refetch()} /></div>
        ) : sessions.rows.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message="No online sessions recorded yet." /></div>
        ) : (
          <>
            <TableWrap>
              <table className={`w-full min-w-[860px] text-left text-sm transition-opacity ${sessions.isFetching ? 'opacity-60' : ''}`}>
                <thead>
                  <tr>
                    <Th>Pupil</Th>
                    <Th>Exam</Th>
                    <Th>Class</Th>
                    <Th>Time Left</Th>
                    <Th>Score</Th>
                    <Th>Submitted</Th>
                    <Th>Marked</Th>
                    <Th>Last Active</Th>
                    <Th>Activity</Th>
                    <Th><span className="sr-only">Actions</span></Th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.rows.map((r) => (
                    <tr key={r.id} className="hover:bg-cream/40 transition-colors">
                      <Td>
                        <span className="font-bold">{r.user?.user_name ?? '—'}</span>
                        <span className="block text-xs text-muted">{r.user?.user_email ?? ''}</span>
                      </Td>
                      <Td>{r.exam?.exam_name ?? '—'}</Td>
                      <Td className="text-muted">{r.user?.class?.name ?? '—'}</Td>
                      <Td>
                        <span className="inline-flex items-center gap-1 text-xs text-muted">
                          <Clock size={11} /> {fmtTime(r.timeLeft)}
                        </span>
                      </Td>
                      <Td>
                        {r.overallScore != null
                          ? <Pill tone={r.overallScore >= 75 ? 'emerald' : r.overallScore < 40 ? 'rose' : 'sky'}>{Math.round(r.overallScore)}%</Pill>
                          : <span className="text-xs text-muted">—</span>}
                      </Td>
                      <Td>
                        {r.submitted
                          ? <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-medium"><CheckCircle2 size={13} /> Yes</span>
                          : <span className="inline-flex items-center gap-1 text-rose-600 text-xs font-medium"><XCircle size={13} /> No</span>}
                      </Td>
                      <Td>
                        {r.marked
                          ? <Pill tone="emerald">Marked</Pill>
                          : <Pill tone="amber">Unmarked</Pill>}
                      </Td>
                      <Td className="text-muted text-xs">{r.lastActive ? new Date(r.lastActive).toLocaleString() : '—'}</Td>
                      <Td className="text-xs">
                        {r.lastAction ? (
                          <span className="inline-flex flex-col">
                            <span className="font-bold text-brand-700">{actionLabel(r.lastAction)}</span>
                            {r.currentQuestion != null && (
                              <span className="text-muted">Question {r.currentQuestion + 1}</span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </Td>
                      <Td>
                        <span className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigate(`/dashboard/admin/exams/sessions/online/${r.id}`)}
                            className="inline-flex items-center gap-1 rounded border border-line px-2.5 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700"
                            title="View full session detail"
                          >
                            <Eye size={13} /> View
                          </button>
                          <button type="button" onClick={() => remove(r)} className="rounded border border-line px-3 py-1.5 text-xs font-bold text-rose-700 hover:border-rose-300">Delete</button>
                        </span>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
            <Pagination
              total={sessions.total}
              page={sessions.page}
              pageCount={sessions.pageCount}
              limit={sessions.limit}
              onPage={sessions.setPage}
              onLimit={sessions.setLimit}
              disabled={sessions.isFetching}
              noun="session(s)"
            />
          </>
        )}
      </Card>
    </div>
  );
};
