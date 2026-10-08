import { Suspense, lazy, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pagination, Pill } from '@/components/dashboard/DashboardUI';
import { useAuth } from '@/context/AuthContext';
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api';
import { usePagedList } from '@/lib/pagedQuery';
import { ROUTES } from '@/routes/paths';
import { HelpCircle, Pencil, Trash2 } from 'lucide-react';

const QuestionEditor = lazy(() => import('@/lib/mdxEditor').then((m) => ({ default: m.NewsEditor })));

type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_IN_THE_BLANK';

const QUESTION_TYPES: Array<{ value: QuestionType | ''; label: string }> = [
  { value: '', label: 'All types' },
  { value: 'MULTIPLE_CHOICE', label: 'Multiple choice' },
  { value: 'TRUE_FALSE', label: 'True / False' },
  { value: 'FILL_IN_THE_BLANK', label: 'Fill in the blank' },
];

interface QuestionItem {
  id: string;
  type: QuestionType;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
  explanation?: string | null;
}

const inputClass = 'mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500';

const EMPTY_FORM = { type: 'MULTIPLE_CHOICE' as QuestionType, question: '', correct_answer: '', incorrect: '', explanation: '', editingId: null as string | null };

export const SubjectQuestionsPage = () => {
  const { classId = '', examId = '', subjectId = '' } = useParams<{ classId: string; examId: string; subjectId: string }>();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<QuestionType | ''>('');

  const questions = usePagedList<QuestionItem>(
    ['subject-questions', examId, subjectId, query, typeFilter],
    (page, limit) =>
      apiGet<QuestionItem[]>('/questions', {
        examId,
        subjectId,
        searchTerm: query || undefined,
        type: typeFilter || undefined,
        page,
        limit,
      }),
  );

  const [form, setForm] = useState(EMPTY_FORM);
  const [editorKey, setEditorKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const set = (patch: Partial<typeof EMPTY_FORM>) => setForm((f) => ({ ...f, ...patch }));
  const editing = form.editingId !== null;

  const incorrectAnswers = () =>
    form.incorrect
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question.trim() || !form.correct_answer.trim()) {
      setNotice('Question text and the correct answer are required.');
      return;
    }
    if (form.type === 'MULTIPLE_CHOICE' && incorrectAnswers().length < 1) {
      setNotice('Add at least one incorrect option (one per line).');
      return;
    }
    if (form.type === 'TRUE_FALSE' && incorrectAnswers().length !== 1) {
      setNotice('True/False needs exactly one opposite answer.');
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const payload = {
        type: form.type,
        question: form.question.trim(),
        correct_answer: form.correct_answer.trim(),
        incorrect_answers: form.type === 'FILL_IN_THE_BLANK' ? [] : incorrectAnswers(),
        explanation: form.explanation.trim() || undefined,
        examId,
        subjectId,
        classId,
        workspaceId: user?.workspaceId,
      };
      if (form.editingId) {
        await apiPut(`/questions/${form.editingId}`, payload);
        setNotice('Question updated.');
      } else {
        await apiPost('/questions', payload);
        setNotice('Question added to this subject.');
      }
      setForm(EMPTY_FORM);
      setEditorKey((k) => k + 1); // remount editor (markdown is initial-only)
      questions.invalidate();
    } catch (err: any) {
      setNotice(err?.message ?? 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (q: QuestionItem) => {
    setForm({
      type: q.type,
      question: q.question,
      correct_answer: q.correct_answer,
      incorrect: (q.incorrect_answers ?? []).join('\n'),
      explanation: q.explanation ?? '',
      editingId: q.id,
    });
    setNotice(null);
    setEditorKey((k) => k + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setForm(EMPTY_FORM);
    setEditorKey((k) => k + 1);
  };

  const remove = async (q: QuestionItem) => {
    if (!confirm('Delete this question? This cannot be undone.')) return;
    try {
      await apiDelete(`/questions/${q.id}`);
      if (form.editingId === q.id) cancelEdit();
      setNotice('Question deleted.');
      questions.invalidate();
    } catch (err: any) {
      setNotice(err?.message ?? 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Exam & Test · Questions"
        title="Questions"
        text="Every question in this subject. Pupils answer these when they sit the exam."
      />
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link to={ROUTES.adminExams} className="font-bold text-brand-700 hover:text-brand-500">Classes</Link>
        <span className="px-2">/</span>
        <Link to={`/dashboard/admin/exams/${classId}`} className="font-bold text-brand-700 hover:text-brand-500">Exams</Link>
        <span className="px-2">/</span>
        <Link to={`/dashboard/admin/exams/${classId}/${examId}`} className="font-bold text-brand-700 hover:text-brand-500">Subjects</Link>
        <span className="px-2">/</span>
        <span className="text-ink" aria-current="page">Questions</span>
      </nav>
      {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

      <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">{editing ? 'Edit' : 'Compose'}</p>
          <h3 className="mt-2 font-display text-lg font-extrabold">{editing ? 'Edit question' : 'New question'}</h3>
          <form className="mt-5 space-y-4" onSubmit={save}>
            <label className="block text-sm font-semibold">Question type
              <select value={form.type} onChange={(e) => set({ type: e.target.value as QuestionType })} className={inputClass}>
                <option value="MULTIPLE_CHOICE">Multiple choice</option>
                <option value="TRUE_FALSE">True / False</option>
                <option value="FILL_IN_THE_BLANK">Fill in the blank</option>
              </select>
            </label>
            <div>
              <p className="text-sm font-semibold">Question text</p>
              <div className="mt-2">
                <Suspense fallback={<LoadingSkeleton rows={3} />}>
                  <QuestionEditor key={editorKey} initialValue={form.question} onChange={(md) => set({ question: md })} />
                </Suspense>
              </div>
            </div>
            <label className="block text-sm font-semibold">Correct answer
              <input value={form.correct_answer} onChange={(e) => set({ correct_answer: e.target.value })} required placeholder="The right answer" className={`${inputClass} text-sm`} />
            </label>
            {form.type !== 'FILL_IN_THE_BLANK' && (
              <label className="block text-sm font-semibold">
                {form.type === 'TRUE_FALSE' ? 'Opposite answer (exactly one)' : 'Incorrect options (one per line)'}
                <textarea rows={3} value={form.incorrect} onChange={(e) => set({ incorrect: e.target.value })} placeholder={form.type === 'TRUE_FALSE' ? 'e.g. False' : 'e.g. Paris\nLondon\nBerlin'} className="mt-2 w-full rounded border border-line bg-white px-3 py-3 text-sm outline-none focus:border-brand-500" />
              </label>
            )}
            <label className="block text-sm font-semibold">Explanation (optional)
              <textarea rows={2} value={form.explanation} onChange={(e) => set({ explanation: e.target.value })} placeholder="Why is this the answer?" className="mt-2 w-full rounded border border-line bg-white px-3 py-3 text-sm outline-none focus:border-brand-500" />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={busy} className="min-h-11 flex-1 rounded bg-brand-900 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
                {busy ? 'Saving…' : editing ? 'Save changes' : 'Add question'}
              </button>
              {editing && (
                <button type="button" onClick={cancelEdit} className="min-h-11 rounded border border-line bg-white px-5 py-3 text-sm font-bold text-muted hover:text-ink">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </Card>

        <Card>
          <CardHead title="Question bank" sub={`${questions.total} shown`} />
          <form
            className="flex flex-wrap gap-2 border-b border-line px-5 py-4"
            onSubmit={(e) => {
              e.preventDefault();
              setQuery(search);
              questions.resetPage();
            }}
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search question text…"
              aria-label="Search questions"
              className="min-h-11 w-full max-w-xs rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500"
            />
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value as QuestionType | ''); questions.resetPage(); }}
              aria-label="Filter by question type"
              className="min-h-11 rounded border border-line bg-white px-3 text-sm font-semibold"
            >
              {QUESTION_TYPES.map((t) => <option key={t.label} value={t.value}>{t.label}</option>)}
            </select>
            <button type="submit" className="min-h-11 rounded bg-brand-900 px-4 text-sm font-bold text-white hover:bg-brand-700">Search</button>
            {(search || typeFilter) && (
              <button type="button" onClick={() => { setSearch(''); setQuery(''); setTypeFilter(''); questions.resetPage(); }} className="min-h-11 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink">
                Reset
              </button>
            )}
          </form>
          {questions.isPending ? (
            <div className="px-5 py-5"><LoadingSkeleton rows={4} /></div>
          ) : questions.isError ? (
            <div className="px-5 py-5"><ErrorState message="Could not load questions" onRetry={() => questions.refetch()} /></div>
          ) : questions.rows.length === 0 ? (
            <div className="px-5 py-5"><EmptyState message={query || typeFilter ? 'No questions match your filters.' : 'No questions yet — compose the first one.'} /></div>
          ) : (
            <>
              <ul className={`divide-y divide-line transition-opacity ${questions.isFetching ? 'opacity-60' : ''}`}>
                {questions.rows.map((q, i) => (
                  <li key={q.id} className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                          <HelpCircle size={16} aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold">
                            <span className="mr-2 text-muted">Q{(questions.page - 1) * questions.limit + i + 1}.</span>
                            {q.question}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            Answer: <b className="text-emerald-700">{q.correct_answer}</b>
                            {q.incorrect_answers?.length > 0 && <> · Options: {q.incorrect_answers.join(' / ')}</>}
                          </p>
                          {q.explanation && <p className="mt-1 text-xs italic text-muted">{q.explanation}</p>}
                        </div>
                      </div>
                      <span className="flex shrink-0 items-center gap-2">
                        <Pill tone="sky">{q.type.replace(/_/g, ' ')}</Pill>
                        <button type="button" onClick={() => startEdit(q)} aria-label="Edit question" title="Edit" className="rounded border border-line px-3 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700">
                          <Pencil aria-hidden="true" size={14} />
                        </button>
                        <button type="button" onClick={() => remove(q)} aria-label="Delete question" title="Delete" className="rounded border border-line px-3 py-1.5 text-xs font-bold text-rose-700 hover:border-rose-300">
                          <Trash2 aria-hidden="true" size={14} />
                        </button>
                      </span>
                    </div>
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
    </div>
  );
};
