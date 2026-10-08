import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pagination } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { apiGet } from '@/lib/api';
import { usePagedList } from '@/lib/pagedQuery';
import type { ClassItem, ExamItem } from '@/data/dashboard';
import { ChevronRight, Clock, FileText } from 'lucide-react';

interface ExamRow extends ExamItem {
  class?: { name: string } | null;
  _count?: { questions?: number; results?: number; subjects?: number };
}

export const AllExamsPage = () => {
  const [classFilter, setClassFilter] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const classes = useResource<ClassItem[]>('/classes', { limit: 200 });
  const exams = usePagedList<ExamRow>(
    ['all-exams', classFilter, query],
    (page, limit) =>
      apiGet<ExamRow[]>('/exams', { classId: classFilter || undefined, searchTerm: query || undefined, page, limit }),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Exam & Test"
        title="Exams"
        text="Every examination across classes. Pick one to manage its subjects and questions — or drill down from Classes."
      />
      <Card>
        <CardHead title="All exams" sub={`${exams.total} shown`} />
        <form
          className="flex flex-wrap gap-2 border-b border-line px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search);
            exams.resetPage();
          }}
        >
          <select
            value={classFilter}
            onChange={(e) => { setClassFilter(e.target.value); exams.resetPage(); }}
            aria-label="Filter by class"
            className="min-h-11 rounded border border-line bg-white px-3 text-sm font-semibold"
          >
            <option value="">All classes</option>
            {(classes.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exam name…" className="min-h-11 w-full max-w-xs rounded border border-line px-3 text-sm outline-none focus:border-brand-500" />
          <button type="submit" className="min-h-11 rounded bg-brand-900 px-4 text-sm font-bold text-white hover:bg-brand-700">Search</button>
          {(search || classFilter) && (
            <button type="button" onClick={() => { setSearch(''); setQuery(''); setClassFilter(''); exams.resetPage(); }} className="min-h-11 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink">
              Reset
            </button>
          )}
        </form>
        {exams.isPending ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={5} /></div>
        ) : exams.isError ? (
          <div className="px-5 py-5"><ErrorState message="Could not load exams" onRetry={() => exams.refetch()} /></div>
        ) : exams.rows.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message="No exams found. Create one from a class page." /></div>
        ) : (
          <>
            <ul className={`divide-y divide-line transition-opacity ${exams.isFetching ? 'opacity-60' : ''}`}>
              {exams.rows.map((exam) => (
                <li key={exam.id}>
                  <Link to={`/dashboard/admin/exams/${exam.classId}/${exam.id}`} className="group flex items-center gap-3 px-5 py-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 group-hover:bg-brand-500 group-hover:text-white">
                      <FileText size={18} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-display text-base font-extrabold group-hover:text-brand-700">{exam.exam_name}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
                        <span className="inline-flex items-center gap-1"><Clock size={12} aria-hidden="true" /> {exam.minutes} mins</span>
                        {exam.class?.name && <span>· {exam.class.name}</span>}
                        <span>· {exam._count?.subjects ?? 0} subjects</span>
                        <span>· {exam._count?.questions ?? 0} questions</span>
                        <span>· {exam._count?.results ?? 0} results</span>
                      </span>
                    </span>
                    <ChevronRight size={16} aria-hidden="true" className="shrink-0 text-muted group-hover:text-brand-700" />
                  </Link>
                </li>
              ))}
            </ul>
            <Pagination
              total={exams.total}
              page={exams.page}
              pageCount={exams.pageCount}
              limit={exams.limit}
              onPage={exams.setPage}
              onLimit={exams.setLimit}
              disabled={exams.isFetching}
              noun="exam(s)"
            />
          </>
        )}
      </Card>
    </div>
  );
};
