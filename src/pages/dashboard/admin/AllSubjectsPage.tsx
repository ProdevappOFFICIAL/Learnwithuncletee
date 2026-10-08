import { useState } from 'react';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pagination } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { apiGet } from '@/lib/api';
import { usePagedList } from '@/lib/pagedQuery';
import type { ClassItem, SubjectItem } from '@/data/dashboard';
import { BookOpen, HelpCircle } from 'lucide-react';

interface SubjectRow extends SubjectItem {
  classes?: Array<{ id: string; name: string }>;
  _count?: { questions?: number };
}

export const AllSubjectsPage = () => {
  const [classFilter, setClassFilter] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const classes = useResource<ClassItem[]>('/classes', { limit: 200 });
  const subjects = usePagedList<SubjectRow>(
    ['all-subjects', classFilter, query],
    (page, limit) =>
      apiGet<SubjectRow[]>('/subjects', {
        classId: classFilter || undefined,
        searchTerm: query || undefined,
        page,
        limit,
      }),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Exam & Test"
        title="Subjects"
        text="Every subject across classes. To manage a subject's questions, open it inside its exam via Classes."
      />
      <Card>
        <CardHead title="All subjects" sub={`${subjects.total} shown`} />
        <form
          className="flex flex-wrap gap-2 border-b border-line px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search);
            subjects.resetPage();
          }}
        >
          <select
            value={classFilter}
            onChange={(e) => { setClassFilter(e.target.value); subjects.resetPage(); }}
            aria-label="Filter by class"
            className="min-h-11 rounded border border-line bg-white px-3 text-sm font-semibold"
          >
            <option value="">All classes</option>
            {(classes.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or code…" className="min-h-11 w-full max-w-xs rounded border border-line px-3 text-sm outline-none focus:border-brand-500" />
          <button type="submit" className="min-h-11 rounded bg-brand-900 px-4 text-sm font-bold text-white hover:bg-brand-700">Search</button>
          {(search || classFilter) && (
            <button type="button" onClick={() => { setSearch(''); setQuery(''); setClassFilter(''); subjects.resetPage(); }} className="min-h-11 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink">
              Reset
            </button>
          )}
        </form>
        {subjects.isPending ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={5} /></div>
        ) : subjects.isError ? (
          <div className="px-5 py-5"><ErrorState message="Could not load subjects" onRetry={() => subjects.refetch()} /></div>
        ) : subjects.rows.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message="No subjects found." /></div>
        ) : (
          <>
            <ul className={`divide-y divide-line transition-opacity ${subjects.isFetching ? 'opacity-60' : ''}`}>
              {subjects.rows.map((s) => (
                <li key={s.id} className="flex items-center gap-3 px-5 py-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                    <BookOpen size={18} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-base font-extrabold">
                      {s.name}
                      {s.code && <span className="ml-2 text-xs font-bold text-muted">{s.code}</span>}
                    </span>
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
                      <span className="truncate">{(s.classes ?? []).map((c) => c.name).join(' · ') || 'No class linked'}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1"><HelpCircle size={12} aria-hidden="true" /> {s._count?.questions ?? 0} questions</span>
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <Pagination
              total={subjects.total}
              page={subjects.page}
              pageCount={subjects.pageCount}
              limit={subjects.limit}
              onPage={subjects.setPage}
              onLimit={subjects.setLimit}
              disabled={subjects.isFetching}
              noun="subject(s)"
            />
          </>
        )}
      </Card>
    </div>
  );
};
