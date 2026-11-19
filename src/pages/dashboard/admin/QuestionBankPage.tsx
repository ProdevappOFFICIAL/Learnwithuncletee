import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pagination, Pill } from '@/components/dashboard/DashboardUI';
import { apiGet } from '@/lib/api';
import { useAcademicSettings } from '@/lib/academic';
import { usePagedList } from '@/lib/pagedQuery';
import { ROUTES } from '@/routes/paths';
import { ArrowLeft, HelpCircle, Library } from 'lucide-react';

interface BankGroup {
  session: string;
  term: string;
  count: number;
}

interface BankQuestion {
  id: string;
  question: string;
  type: string;
  session?: string | null;
  term?: string | null;
  exam?: { exam_name: string } | null;
  subject?: { name: string } | null;
}

const groupKey = (group: BankGroup) => `${group.session}||${group.term}`;

export const QuestionBankPage = () => {
  const academic = useAcademicSettings();
  const currentSession = academic.data?.data.session ?? '';
  const currentTerm = academic.data?.data.term ?? '';
  const [selectedKey, setSelectedKey] = useState('');

  const groupsQuery = useQuery({
    queryKey: ['question-bank-groups'],
    queryFn: async () => (await apiGet<BankGroup[]>('/questions/bank')).data,
    staleTime: 60_000,
  });
  const groups = groupsQuery.data ?? [];
  const selected = groups.find((group) => groupKey(group) === selectedKey) ?? null;

  useEffect(() => {
    if (selectedKey || !groups.length) return;
    const current = groups.find(
      (group) => group.session === currentSession && group.term === currentTerm,
    );
    setSelectedKey(groupKey(current ?? groups[0]));
  }, [groups, selectedKey, currentSession, currentTerm]);

  const questions = usePagedList<BankQuestion>(
    ['question-bank', selected?.session ?? '', selected?.term ?? ''],
    async (page, limit) => {
      if (!selected) return { data: [], meta: { total: 0, page, limit } };
      return apiGet<BankQuestion[]>('/questions', {
        session: selected.session,
        term: selected.term,
        page,
        limit,
      });
    },
  );

  const selectGroup = (group: BankGroup) => {
    if (groupKey(group) === selectedKey) return;
    setSelectedKey(groupKey(group));
    questions.resetPage();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Exam & Test"
        title="Question Bank"
        text="Questions grouped by the session and term they were created in. Open a group to see every question in it."
        actions={
          <Link
            to={ROUTES.adminAllQuestions}
            className="inline-flex min-h-11 items-center rounded border border-line bg-white px-4 py-2.5 text-sm font-bold hover:border-brand-500 hover:text-brand-700"
          >
            <ArrowLeft aria-hidden="true" size={15} className="mr-2" /> All Questions
          </Link>
        }
      />

      <Card>
        <CardHead
          title="Session & term groups"
          sub={`${groups.length} group(s)${currentSession ? ` · current: ${currentSession} · ${currentTerm}` : ''}`}
        />
        {groupsQuery.isPending ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={4} /></div>
        ) : groupsQuery.isError ? (
          <div className="px-5 py-5"><ErrorState message="Could not load the question bank" onRetry={() => groupsQuery.refetch()} /></div>
        ) : groups.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message="No questions have been saved with a session and term yet." /></div>
        ) : (
          <div className="grid gap-3 px-5 py-5 sm:grid-cols-2 xl:grid-cols-3">
            {groups.map((group) => {
              const key = groupKey(group);
              const active = key === selectedKey;
              const isCurrent = group.session === currentSession && group.term === currentTerm;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectGroup(group)}
                  aria-pressed={active}
                  className={`flex items-start justify-between gap-3 rounded border px-4 py-3 text-left transition-colors ${
                    active
                      ? 'border-brand-500 bg-brand-50'
                      : 'border-line bg-white hover:border-brand-300'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-2">
                      <Library size={15} aria-hidden="true" className="shrink-0 text-brand-700" />
                      <span className="text-sm font-extrabold text-ink">{group.session}</span>
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-muted">{group.term}</span>
                    <span className="mt-2 flex flex-wrap gap-1.5">
                      <Pill tone={active ? 'emerald' : 'sky'}>{group.count} question(s)</Pill>
                      {isCurrent && <Pill tone="amber">Current</Pill>}
                    </span>
                  </span>
                  <span className={`mt-1 text-xs font-bold ${active ? 'text-brand-700' : 'text-muted'}`}>
                    {active ? 'Open' : 'View'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      {selected && (
        <Card>
          <CardHead
            title={`${selected.session} · ${selected.term}`}
            sub={`${questions.total} question(s) in this group`}
          />
          {questions.isPending ? (
            <div className="px-5 py-5"><LoadingSkeleton rows={5} /></div>
          ) : questions.isError ? (
            <div className="px-5 py-5"><ErrorState message="Could not load this group’s questions" onRetry={() => questions.refetch()} /></div>
          ) : questions.rows.length === 0 ? (
            <div className="px-5 py-5"><EmptyState message="No questions in this group." /></div>
          ) : (
            <>
              <ul className={`divide-y divide-line transition-opacity ${questions.isFetching ? 'opacity-60' : ''}`}>
                {questions.rows.map((q, index) => (
                  <li key={q.id} className="flex items-start gap-3 px-5 py-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                      <HelpCircle size={16} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold">
                        <span className="mr-2 text-muted">Q{(questions.page - 1) * questions.limit + index + 1}.</span>
                        {q.question}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                        <Pill tone="sky">{q.type.replace(/_/g, ' ')}</Pill>
                        {q.exam?.exam_name && <span>{q.exam.exam_name}</span>}
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
      )}
    </div>
  );
};
