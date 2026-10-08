import { useState } from 'react';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pagination, Pill } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { apiGet } from '@/lib/api';
import { usePagedList } from '@/lib/pagedQuery';
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

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'MULTIPLE_CHOICE', label: 'Multiple choice' },
  { value: 'TRUE_FALSE', label: 'True / False' },
  { value: 'FILL_IN_THE_BLANK', label: 'Fill in the blank' },
];

export const AllQuestionsPage = () => {
  const [examFilter, setExamFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const exams = useResource<ExamItem[]>('/exams', { limit: 200 });
  const subjects = useResource<SubjectItem[]>('/subjects', { limit: 200 });
  const questions = usePagedList<QuestionRow>(
    ['all-questions', examFilter, subjectFilter, typeFilter, query],
    (page, limit) =>
      apiGet<QuestionRow[]>('/questions', {
        examId: examFilter || undefined,
        subjectId: subjectFilter || undefined,
        type: typeFilter || undefined,
        searchTerm: query || undefined,
        page,
        limit,
      }),
  );

  const applyFilterReset = () => questions.resetPage();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Exam & Test"
        title="Questions"
        text="Every question across exams. Open one inside its exam + subject to edit it."
      />
      <Card>
        <CardHead title="All questions" sub={`${questions.total} shown`} />
        <form
          className="flex flex-wrap gap-2 border-b border-line px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search);
            questions.resetPage();
          }}
        >
          <select value={examFilter} onChange={(e) => { setExamFilter(e.target.value); applyFilterReset(); }} aria-label="Filter by exam" className="min-h-11 rounded border border-line bg-white px-3 text-sm font-semibold">
            <option value="">All exams</option>
            {(exams.data ?? []).map((x) => <option key={x.id} value={x.id}>{x.exam_name}</option>)}
          </select>
          <select value={subjectFilter} onChange={(e) => { setSubjectFilter(e.target.value); applyFilterReset(); }} aria-label="Filter by subject" className="min-h-11 rounded border border-line bg-white px-3 text-sm font-semibold">
            <option value="">All subjects</option>
            {(subjects.data ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); applyFilterReset(); }} aria-label="Filter by question type" className="min-h-11 rounded border border-line bg-white px-3 text-sm font-semibold">
            {TYPE_OPTIONS.map((t) => <option key={t.label} value={t.value}>{t.label}</option>)}
          </select>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search question text…" className="min-h-11 w-full max-w-xs rounded border border-line px-3 text-sm outline-none focus:border-brand-500" />
          <button type="submit" className="min-h-11 rounded bg-brand-900 px-4 text-sm font-bold text-white hover:bg-brand-700">Search</button>
          {(search || examFilter || subjectFilter || typeFilter) && (
            <button type="button" onClick={() => { setSearch(''); setQuery(''); setExamFilter(''); setSubjectFilter(''); setTypeFilter(''); questions.resetPage(); }} className="min-h-11 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink">
              Reset
            </button>
          )}
        </form>
        {questions.isPending ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={5} /></div>
        ) : questions.isError ? (
          <div className="px-5 py-5"><ErrorState message="Could not load questions" onRetry={() => questions.refetch()} /></div>
        ) : questions.rows.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message="No questions found." /></div>
        ) : (
          <>
            <ul className={`divide-y divide-line transition-opacity ${questions.isFetching ? 'opacity-60' : ''}`}>
              {questions.rows.map((q, i) => (
                <li key={q.id} className="flex items-start gap-3 px-5 py-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                    <HelpCircle size={16} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-bold">
                      <span className="mr-2 text-muted">Q{(questions.page - 1) * questions.limit + i + 1}.</span>
                      {q.question}
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <Pill tone="sky">{q.type.replace(/_/g, ' ')}</Pill>
                      <span>{q.exam?.exam_name ?? ''}</span>
                      {q.subject?.name && <span>· {q.subject.name}</span>}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <Pagination
              total={questions.total}
              page={questions.page}
              pageCount={questions.pageCount}
              limit={questions.limit}
              onPage={questions.setPage}
              onLimit={questions.setLimit}
              disabled={questions.isFetching}
              noun="question(s)"
            />
          </>
        )}
      </Card>
    </div>
  );
};
