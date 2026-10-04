import { useState } from 'react';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pill } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import type { ExamItem, SubjectItem } from '@/data/dashboard';
import { HelpCircle } from 'lucide-react';

interface QuestionRow {
  id: string;
  question: string;
  type: string;
  examId: string;
  subjectId: string;
  exam?: { exam_name: string } | null;
  subject?: { name: string } | null;
}

export const AllQuestionsPage = () => {
  const [examFilter, setExamFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const exams = useResource<ExamItem[]>('/exams', { limit: 200 });
  const subjects = useResource<SubjectItem[]>('/subjects', { limit: 200 });
  const { data, loading, error, reload } = useResource<QuestionRow[]>('/questions', {
    examId: examFilter || undefined,
    subjectId: subjectFilter || undefined,
    limit: 200,
  });

  const list = (data ?? []).filter((q) => q.question.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Exam & Test"
        title="Questions"
        text="Every question across exams. Open one inside its exam + subject to edit it."
      />
      <Card>
        <CardHead title="All questions" sub={`${list.length} shown`} />
        <form
          className="flex flex-wrap gap-2 border-b border-line px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search);
          }}
        >
          <select value={examFilter} onChange={(e) => setExamFilter(e.target.value)} aria-label="Filter by exam" className="min-h-11 rounded border border-line bg-white px-3 text-sm font-semibold">
            <option value="">All exams</option>
            {(exams.data ?? []).map((x) => <option key={x.id} value={x.id}>{x.exam_name}</option>)}
          </select>
          <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} aria-label="Filter by subject" className="min-h-11 rounded border border-line bg-white px-3 text-sm font-semibold">
            <option value="">All subjects</option>
            {(subjects.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search question text…" className="min-h-11 w-full max-w-xs rounded border border-line px-3 text-sm outline-none focus:border-brand-500" />
          <button type="submit" className="min-h-11 rounded bg-brand-900 px-4 text-sm font-bold text-white hover:bg-brand-700">Search</button>
        </form>
        {loading ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={5} /></div>
        ) : error || !data ? (
          <div className="px-5 py-5"><ErrorState message={error ?? 'No data'} onRetry={reload} /></div>
        ) : list.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message="No questions found." /></div>
        ) : (
          <ul className="divide-y divide-line">
            {list.map((q) => (
              <li key={q.id} className="flex items-start gap-3 px-5 py-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  <HelpCircle size={16} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold">{q.question}</span>
                  <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <Pill tone="sky">{q.type.replace(/_/g, ' ')}</Pill>
                    <span>{q.exam?.exam_name ?? ''}</span>
                    {q.subject?.name && <span>· {q.subject.name}</span>}
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
