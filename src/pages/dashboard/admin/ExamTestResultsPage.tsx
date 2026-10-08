import { Fragment, useState } from 'react';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pagination, Pill, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { apiDelete, apiGet } from '@/lib/api';
import { usePagedList } from '@/lib/pagedQuery';
import type { ClassItem } from '@/data/dashboard';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface TestResultRow {
  id: string;
  overallScore: number;
  attempted_questions: number;
  total_questions: number;
  date: string;
  user?: { user_name: string; user_email: string; class?: { name: string } | null };
  exam?: { exam_name: string };
  subjectScores?: Record<string, { correct: number; total: number }>;
  subjectNames?: Record<string, string>;
}

const breakdownOf = (r: TestResultRow) =>
  Object.entries(r.subjectScores ?? {})
    .map(([id, s]) => ({ id, name: r.subjectNames?.[id] ?? 'Unknown subject', correct: s.correct, total: s.total }))
    .sort((a, b) => a.name.localeCompare(b.name));

export const ExamTestResultsPage = () => {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const classes = useResource<ClassItem[]>('/classes', { limit: 200 });

  const results = usePagedList<TestResultRow>(
    ['test-results', query, classFilter],
    (page, limit) =>
      apiGet<TestResultRow[]>('/results', {
        searchTerm: query || undefined,
        classId: classFilter || undefined,
        page,
        limit,
      }),
  );

  const remove = async (row: TestResultRow) => {
    if (!confirm(`Delete the test result of ${row.user?.user_name ?? 'this pupil'} for "${row.exam?.exam_name ?? 'this exam'}"? This cannot be undone.`)) return;
    try {
      await apiDelete(`/results/${row.id}`);
      setNotice('Test result deleted.');
      results.invalidate();
    } catch (err: any) {
      setNotice(err?.message ?? 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Exam & Test"
        title="Test Results"
        text="Overall scores from pupils sitting exams on the platform. Expand a row for per-subject marks. Report-sheet PDFs live under Results."
      />
      {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

      <Card>
        <CardHead title="All attempts" sub={`${results.total} newest first`} />
        <form
          className="flex flex-wrap gap-2 border-b border-line px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search);
            results.resetPage();
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pupil or exam…"
            aria-label="Search test results"
            className="min-h-11 w-full max-w-xs rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500"
          />
          <select
            value={classFilter}
            onChange={(e) => { setClassFilter(e.target.value); results.resetPage(); }}
            aria-label="Filter by class"
            className="min-h-11 rounded border border-line bg-white px-3 text-sm font-semibold"
          >
            <option value="">All classes</option>
            {(classes.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <button type="submit" className="min-h-11 rounded bg-brand-900 px-4 text-sm font-bold text-white hover:bg-brand-700">Search</button>
          {(search || classFilter) && (
            <button type="button" onClick={() => { setSearch(''); setQuery(''); setClassFilter(''); results.resetPage(); }} className="min-h-11 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink">
              Reset
            </button>
          )}
        </form>
        {results.isPending ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={5} /></div>
        ) : results.isError ? (
          <div className="px-5 py-5"><ErrorState message="Could not load results" onRetry={() => results.refetch()} /></div>
        ) : results.rows.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message="No test attempts recorded yet." /></div>
        ) : (
          <>
            <TableWrap>
              <table className={`w-full min-w-[840px] text-left text-sm transition-opacity ${results.isFetching ? 'opacity-60' : ''}`}>
                <thead><tr><Th>Pupil</Th><Th>Exam</Th><Th>Class</Th><Th>Score</Th><Th>Attempted</Th><Th>Submitted</Th><Th><span className="sr-only">Actions</span></Th></tr></thead>
                <tbody>
                  {results.rows.map((r) => {
                    const open = expanded === r.id;
                    const parts = breakdownOf(r);
                    return (
                      <Fragment key={r.id}>
                        <tr>
                          <Td><span className="font-bold">{r.user?.user_name ?? '—'}</span><span className="block text-xs text-muted">{r.user?.user_email ?? ''}</span></Td>
                          <Td>{r.exam?.exam_name ?? '—'}</Td>
                          <Td className="text-muted">{r.user?.class?.name ?? '—'}</Td>
                          <Td><Pill tone={r.overallScore >= 75 ? 'emerald' : r.overallScore < 40 ? 'rose' : 'sky'}>{r.overallScore}%</Pill></Td>
                          <Td className="text-muted">{r.attempted_questions}/{r.total_questions}</Td>
                          <Td className="text-muted">{new Date(r.date).toLocaleString()}</Td>
                          <Td>
                            <span className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => setExpanded(open ? null : r.id)}
                                aria-expanded={open}
                                aria-label={open ? 'Hide subject breakdown' : 'Show subject breakdown'}
                                title="Subject breakdown"
                                className="inline-flex items-center gap-1 rounded border border-line px-2.5 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700"
                              >
                                {open ? <ChevronDown aria-hidden="true" size={14} /> : <ChevronRight aria-hidden="true" size={14} />}
                                Subjects
                              </button>
                              <button type="button" onClick={() => remove(r)} className="rounded border border-line px-3 py-1.5 text-xs font-bold text-rose-700 hover:border-rose-300">Delete</button>
                            </span>
                          </Td>
                        </tr>
                        {open && (
                          <tr>
                            <td colSpan={7} className="border-t border-line bg-cream/60 px-5 py-4">
                              {parts.length === 0 ? (
                                <p className="text-xs text-muted">No per-subject data on this attempt.</p>
                              ) : (
                                <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                  {parts.map((p) => (
                                    <li key={p.id} className="flex items-center justify-between gap-2 rounded border border-line bg-cream px-3 py-2">
                                      <span className="truncate text-xs font-bold">{p.name}</span>
                                      <span className="shrink-0 font-mono text-xs font-extrabold text-brand-700">
                                        {p.correct}/{p.total}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
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
              total={results.total}
              page={results.page}
              pageCount={results.pageCount}
              limit={results.limit}
              onPage={results.setPage}
              onLimit={results.setLimit}
              disabled={results.isFetching}
              noun="attempt(s)"
            />
          </>
        )}
      </Card>
    </div>
  );
};
