import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import type { ClassItem, ExamItem } from '@/data/dashboard';
import { ChevronRight, Clock, FileText } from 'lucide-react';

export const AllExamsPage = () => {
  const [classFilter, setClassFilter] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const classes = useResource<ClassItem[]>('/classes');
  const { data, loading, error, reload } = useResource<ExamItem[]>('/exams', { classId: classFilter || undefined, limit: 100 });

  const list = (data ?? []).filter((e) => e.exam_name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Exam & Test"
        title="Exams"
        text="Every examination across classes. Pick one to manage its subjects and questions — or drill down from Classes."
      />
      <Card>
        <CardHead title="All exams" sub={`${list.length} shown`} />
        <form
          className="flex flex-wrap gap-2 border-b border-line px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search);
          }}
        >
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} aria-label="Filter by class" className="min-h-11 rounded border border-line bg-white px-3 text-sm font-semibold">
            <option value="">All classes</option>
            {(classes.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search exam name…" className="min-h-11 w-full max-w-xs rounded border border-line px-3 text-sm outline-none focus:border-brand-500" />
          <button type="submit" className="min-h-11 rounded bg-brand-900 px-4 text-sm font-bold text-white hover:bg-brand-700">Search</button>
        </form>
        {loading ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={5} /></div>
        ) : error || !data ? (
          <div className="px-5 py-5"><ErrorState message={error ?? 'No data'} onRetry={reload} /></div>
        ) : list.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message="No exams found. Create one from a class page." /></div>
        ) : (
          <ul className="divide-y divide-line">
            {list.map((exam) => (
              <li key={exam.id}>
                <Link to={`/dashboard/admin/exams/${exam.classId}/${exam.id}`} className="group flex items-center gap-3 px-5 py-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 group-hover:bg-brand-500 group-hover:text-white">
                    <FileText size={18} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-base font-extrabold group-hover:text-brand-700">{exam.exam_name}</span>
                    <span className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                      <Clock size={12} aria-hidden="true" /> {exam.minutes} mins
                    </span>
                  </span>
                  <ChevronRight size={16} aria-hidden="true" className="shrink-0 text-muted group-hover:text-brand-700" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};
