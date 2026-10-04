import { useState } from 'react';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import type { ClassItem, SubjectItem } from '@/data/dashboard';
import { BookOpen } from 'lucide-react';

interface SubjectRow extends SubjectItem {
  classes?: Array<{ id: string; name: string }>;
}

export const AllSubjectsPage = () => {
  const [classFilter, setClassFilter] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const classes = useResource<ClassItem[]>('/classes');
  const { data, loading, error, reload } = useResource<SubjectRow[]>('/subjects', { limit: 200 });

  const list = (data ?? []).filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(query.toLowerCase()) ||
      (s.code ?? '').toLowerCase().includes(query.toLowerCase());
    const matchesClass = !classFilter || (s.classes ?? []).some((c) => c.id === classFilter);
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Exam & Test"
        title="Subjects"
        text="Every subject across classes. To manage a subject's questions, open it inside its exam via Classes."
      />
      <Card>
        <CardHead title="All subjects" sub={`${list.length} shown`} />
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
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or code…" className="min-h-11 w-full max-w-xs rounded border border-line px-3 text-sm outline-none focus:border-brand-500" />
          <button type="submit" className="min-h-11 rounded bg-brand-900 px-4 text-sm font-bold text-white hover:bg-brand-700">Search</button>
        </form>
        {loading ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={5} /></div>
        ) : error || !data ? (
          <div className="px-5 py-5"><ErrorState message={error ?? 'No data'} onRetry={reload} /></div>
        ) : list.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message="No subjects found." /></div>
        ) : (
          <ul className="divide-y divide-line">
            {list.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-5 py-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  <BookOpen size={18} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-base font-extrabold">
                    {s.name}
                    {s.code && <span className="ml-2 text-xs font-bold text-muted">{s.code}</span>}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted">
                    {(s.classes ?? []).map((c) => c.name).join(' · ') || 'No class linked'}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};
