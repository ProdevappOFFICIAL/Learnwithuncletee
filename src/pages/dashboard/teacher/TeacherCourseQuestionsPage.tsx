import { Suspense, lazy, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pagination, Pill } from '@/components/dashboard/DashboardUI';
import { useAuth } from '@/context/AuthContext';
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api';
import { usePagedList } from '@/lib/pagedQuery';
import { UploadButton } from '@/lib/uploadthing';
import { ROUTES } from '@/routes/paths';
import { HelpCircle, Paperclip, Pencil, Plus, Trash2, X } from 'lucide-react';

const QuestionEditor = lazy(() => import('@/lib/mdxEditor').then((m) => ({ default: m.NewsEditor })));
const QuestionContent = lazy(() => import('@/lib/mdxEditor').then((m) => ({ default: m.NewsContent })));

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
  question_file?: string | null;
}

type FileMode = 'none' | 'online' | 'offline';

const inputClass = 'mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500';

const EMPTY_FORM = {
  type: 'MULTIPLE_CHOICE' as QuestionType,
  question: '',
  correct_answer: '',
  incorrect: ['', '', ''] as string[],
  explanation: '',
  fileMode: 'none' as FileMode,
  question_file: '',
  editingId: null as string | null,
};

/**
 * Teacher's course question bank. Mirrors the admin subject-questions workspace
 * (compose on the left, bank on the right) but scoped by the course the teacher
 * opened — ids arrive as query params from the Assigned Courses page.
 */
export const TeacherCourseQuestionsPage = () => {
  const [params] = useSearchParams();
  const subjectId = params.get('subjectId') ?? '';
  const classId = params.get('classId') ?? '';
  const examId = params.get('examId') ?? '';
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<QuestionType | ''>('');

  const questions = usePagedList<QuestionItem>(
    ['course-questions', examId, subjectId, classId, query, typeFilter],
    (page, limit) =>
      apiGet<QuestionItem[]>('/questions', {
        examId: examId || undefined,
        subjectId: subjectId || undefined,
        classId: classId || undefined,
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

  // Each type owns its answer UI — drop the fields the new type can't use.
  const setType = (type: QuestionType) => {
    if (type === 'MULTIPLE_CHOICE') {
      setForm((f) => ({ ...f, type, incorrect: f.incorrect.length > 0 ? f.incorrect : ['', '', ''] }));
    } else if (type === 'TRUE_FALSE') {
      setForm((f) => ({ ...f, type, correct_answer: f.correct_answer === 'False' ? 'False' : 'True', incorrect: [] }));
    } else {
      setForm((f) => ({ ...f, type, incorrect: [] }));
    }
  };

  const setIncorrectAt = (index: number, value: string) =>
    setForm((f) => ({ ...f, incorrect: f.incorrect.map((v, i) => (i === index ? value : v)) }));

  const addOption = () => setForm((f) => ({ ...f, incorrect: [...f.incorrect, ''] }));

  const removeOption = (index: number) =>
    setForm((f) => ({ ...f, incorrect: f.incorrect.filter((_, i) => i !== index) }));

  const nonEmptyOptions = () => form.incorrect.map((s) => s.trim()).filter(Boolean);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question.trim() || !form.correct_answer.trim()) {
      setNotice('Question text and the correct answer are required.');
      return;
    }
    if (form.type === 'MULTIPLE_CHOICE' && nonEmptyOptions().length < 1) {
      setNotice('Add at least one incorrect option.');
      return;
    }
    if (form.type === 'TRUE_FALSE' && form.correct_answer !== 'True' && form.correct_answer !== 'False') {
      setNotice('Pick True or False as the correct answer.');
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const payload = {
        type: form.type,
        question: form.question.trim(),
        correct_answer: form.correct_answer.trim(),
        // Only multiple-choice carries options — TF and FILL always send [].
        incorrect_answers: form.type === 'MULTIPLE_CHOICE' ? nonEmptyOptions() : [],
        explanation: form.explanation.trim() || undefined,
        // Online: UploadThing URL. Offline: plain path string, resolved later.
        question_file: form.fileMode === 'none' ? null : form.question_file.trim() || null,
        examId: examId || undefined,
        subjectId: subjectId || undefined,
        classId: classId || undefined,
        workspaceId: user?.workspaceId,
      };
      if (form.editingId) {
        await apiPut(`/questions/${form.editingId}`, payload);
        setNotice('Question updated.');
      } else {
        await apiPost('/questions', payload);
        setNotice('Question added to this course.');
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
    const stored = (q.question_file ?? '').trim();
    setForm({
      type: q.type,
      question: q.question,
      correct_answer: q.type === 'TRUE_FALSE' ? (q.correct_answer === 'False' ? 'False' : 'True') : q.correct_answer,
      // Legacy TF rows may carry a stale "opposite answer" — dropped, it's unused.
      incorrect: q.type === 'MULTIPLE_CHOICE' && (q.incorrect_answers ?? []).length > 0 ? q.incorrect_answers : ['', '', ''],
      explanation: q.explanation ?? '',
      // Stored http(s) links came from uploads; anything else is an offline path.
      fileMode: !stored ? 'none' : /^https?:\/\//i.test(stored) ? 'online' : 'offline',
      question_file: stored,
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
        eyebrow="Assigned Courses · Questions"
        title="Questions"
        text="Every question in this course. Compose new ones, or edit what pupils will sit."
      />
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted sm:text-sm">
        <Link to={ROUTES.teacherClasses} className="font-bold text-brand-700 hover:text-brand-500">Assigned Courses</Link>
        <span aria-hidden="true" className="text-line">/</span>
        <span className="text-ink" aria-current="page">Questions</span>
      </nav>
      {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <Card className="min-w-0 p-4 sm:p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">{editing ? 'Edit' : 'Compose'}</p>
          <h3 className="mt-2 font-display text-lg font-extrabold">{editing ? 'Edit question' : 'New question'}</h3>
          <form className="mt-4 space-y-4 sm:mt-5" onSubmit={save}>
            <label className="block text-sm font-semibold">Question type
              <select value={form.type} onChange={(e) => setType(e.target.value as QuestionType)} className={inputClass}>
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
            {form.type === 'TRUE_FALSE' ? (
              <div>
                <p className="text-sm font-semibold">Correct answer</p>
                <div className="mt-2 flex gap-2" role="group" aria-label="True or false">
                  {(['True', 'False'] as const).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => set({ correct_answer: v })}
                      aria-pressed={form.correct_answer === v}
                      className={`min-h-11 flex-1 rounded border px-4 text-sm font-bold transition-colors ${
                        form.correct_answer === v
                          ? 'border-brand-500 bg-brand-50 text-brand-700'
                          : 'border-line bg-white text-muted hover:border-brand-500 hover:text-brand-700'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <label className="block text-sm font-semibold">Correct answer
                <input value={form.correct_answer} onChange={(e) => set({ correct_answer: e.target.value })} required placeholder="The right answer" className={`${inputClass} text-sm`} />
              </label>
            )}
            {form.type === 'MULTIPLE_CHOICE' && (
              <div>
                <p className="text-sm font-semibold">Incorrect options <span className="font-normal text-muted">(min. 1)</span></p>
                <div className="mt-2 space-y-2">
                  {form.incorrect.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11px] font-extrabold text-brand-700 sm:h-8 sm:w-8 sm:text-xs">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <input
                        value={opt}
                        onChange={(e) => setIncorrectAt(idx, e.target.value)}
                        required={idx === 0}
                        placeholder={`Option ${idx + 1}`}
                        aria-label={`Incorrect option ${idx + 1}`}
                        className="min-h-11 min-w-0 flex-1 rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500"
                      />
                      <button
                        type="button"
                        disabled={form.incorrect.length <= 1}
                        onClick={() => removeOption(idx)}
                        aria-label={`Remove option ${idx + 1}`}
                        title="Remove option"
                        className="flex h-11 w-10 shrink-0 items-center justify-center rounded border border-line text-xs font-bold text-rose-700 hover:border-rose-300 disabled:opacity-40"
                      >
                        <Trash2 aria-hidden="true" size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addOption}
                  className="mt-2 inline-flex min-h-10 items-center rounded border border-line bg-white px-4 text-xs font-bold hover:border-brand-500 hover:text-brand-700"
                >
                  <Plus aria-hidden="true" size={14} className="mr-1" /> Add option
                </button>
              </div>
            )}
            <label className="block text-sm font-semibold">Explanation (optional)
              <textarea rows={2} value={form.explanation} onChange={(e) => set({ explanation: e.target.value })} placeholder="Why is this the answer?" className="mt-2 w-full rounded border border-line bg-white px-3 py-3 text-sm outline-none focus:border-brand-500" />
            </label>
            <div>
              <p className="text-sm font-semibold">Attachment <span className="font-normal text-muted">(optional)</span></p>
              <div className="mt-2 grid grid-cols-3 gap-2" role="group" aria-label="Attachment source">
                {(['none', 'online', 'offline'] as FileMode[]).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => set({ fileMode: m, question_file: m === 'none' ? '' : form.question_file })}
                    aria-pressed={form.fileMode === m}
                    className={`min-h-10 rounded border px-2 py-2 text-[11px] font-bold capitalize transition-colors sm:text-xs ${
                      form.fileMode === m
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-line bg-white text-muted hover:border-brand-500 hover:text-brand-700'
                    }`}
                  >
                    {m === 'none' ? 'No file' : m}
                  </button>
                ))}
              </div>
              {form.fileMode === 'online' && (
                <div className="mt-2">
                  {form.question_file ? (
                    <p className="flex items-center gap-2 rounded border border-line bg-cream px-3 py-2 text-xs">
                      <Paperclip size={13} aria-hidden="true" className="shrink-0 text-brand-700" />
                      <span className="min-w-0 flex-1 truncate font-mono">{form.question_file}</span>
                      <button type="button" onClick={() => set({ question_file: '' })} aria-label="Remove uploaded file" className="shrink-0 font-bold text-rose-700 hover:underline">
                        <X size={13} aria-hidden="true" />
                      </button>
                    </p>
                  ) : (
                    <UploadButton
                      endpoint="assignmentUploader"
                      label="Upload file (PDF / image)"
                      onClientUploadComplete={(res) => set({ question_file: res?.[0]?.ufsUrl ?? '' })}
                      onUploadError={(err) => setNotice(err.message)}
                    />
                  )}
                </div>
              )}
              {form.fileMode === 'offline' && (
                <>
                  <input
                    value={form.question_file}
                    onChange={(e) => set({ question_file: e.target.value })}
                    placeholder="e.g. files/biology/q12-diagram.png"
                    aria-label="Offline file path"
                    className={`${inputClass} font-mono text-sm`}
                  />
                  <p className="mt-1 text-xs text-muted">Plain path string — resolved later when offline packs are built.</p>
                </>
              )}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="submit" disabled={busy} className="min-h-11 w-full rounded bg-brand-900 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60 sm:flex-1">
                {busy ? 'Saving…' : editing ? 'Save changes' : 'Add question'}
              </button>
              {editing && (
                <button type="button" onClick={cancelEdit} className="min-h-11 w-full rounded border border-line bg-white px-5 py-3 text-sm font-bold text-muted hover:text-ink sm:w-auto">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </Card>

        <Card className="min-w-0">
          <CardHead title="Question bank" sub={`${questions.total} shown`} />
          <form
            className="flex flex-wrap gap-2 border-b border-line px-4 py-4 sm:px-5"
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
              className="min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500 sm:max-w-xs"
            />
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value as QuestionType | ''); questions.resetPage(); }}
              aria-label="Filter by question type"
              className="min-h-11 w-full rounded border border-line bg-white px-3 text-sm font-semibold sm:w-auto"
            >
              {QUESTION_TYPES.map((t) => <option key={t.label} value={t.value}>{t.label}</option>)}
            </select>
            <button type="submit" className="min-h-11 flex-1 rounded bg-brand-900 px-4 text-sm font-bold text-white hover:bg-brand-700 sm:flex-none">Search</button>
            {(search || typeFilter) && (
              <button type="button" onClick={() => { setSearch(''); setQuery(''); setTypeFilter(''); questions.resetPage(); }} className="min-h-11 flex-1 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink sm:flex-none">
                Reset
              </button>
            )}
          </form>
          {questions.isPending ? (
            <div className="px-4 py-5 sm:px-5"><LoadingSkeleton rows={4} /></div>
          ) : questions.isError ? (
            <div className="px-4 py-5 sm:px-5"><ErrorState message="Could not load questions" onRetry={() => questions.refetch()} /></div>
          ) : questions.rows.length === 0 ? (
            <div className="px-4 py-5 sm:px-5"><EmptyState message={query || typeFilter ? 'No questions match your filters.' : 'No questions yet — compose the first one for this course.'} /></div>
          ) : (
            <>
              <ul className={`divide-y divide-line transition-opacity ${questions.isFetching ? 'opacity-60' : ''}`}>
                {questions.rows.map((q, i) => (
                  <li key={q.id} className="px-4 py-4 sm:px-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 sm:h-9 sm:w-9">
                          <HelpCircle size={16} aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-start gap-2">
                            <span className="shrink-0 text-sm font-bold text-muted">Q{(questions.page - 1) * questions.limit + i + 1}.</span>
                            {/* Question text is markdown — render it with the same
                                viewer used on the pupil result page so teachers
                                see exactly what pupils will see. */}
                            <div className="mdx-question-bank min-w-0 flex-1 break-words text-sm font-bold [overflow-wrap:anywhere]">
                              <Suspense fallback={<span className="whitespace-pre-wrap">{q.question}</span>}>
                                <QuestionContent key={q.id} markdown={q.question} />
                              </Suspense>
                            </div>
                          </div>
                          <p className="mt-1 break-words text-xs text-muted [overflow-wrap:anywhere]">
                            Answer: <b className="text-emerald-700">{q.correct_answer}</b>
                            {q.incorrect_answers?.length > 0 && <> · Options: {q.incorrect_answers.join(' / ')}</>}
                            {q.question_file?.trim() ? (
                              <> · <span className="inline-flex items-center gap-1 font-bold text-brand-700"><Paperclip size={11} aria-hidden="true" /> File attached</span></>
                            ) : null}
                          </p>
                          {q.explanation && <p className="mt-1 break-words text-xs italic text-muted [overflow-wrap:anywhere]">{q.explanation}</p>}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 pl-11 sm:shrink-0 sm:pl-0">
                        <Pill tone="sky">{q.type.replace(/_/g, ' ')}</Pill>
                        <button type="button" onClick={() => startEdit(q)} aria-label="Edit question" title="Edit" className="flex min-h-9 flex-1 items-center justify-center rounded border border-line px-3 text-xs font-bold hover:border-brand-500 hover:text-brand-700 sm:flex-none">
                          <Pencil aria-hidden="true" size={14} />
                        </button>
                        <button type="button" onClick={() => remove(q)} aria-label="Delete question" title="Delete" className="flex min-h-9 flex-1 items-center justify-center rounded border border-line px-3 text-xs font-bold text-rose-700 hover:border-rose-300 sm:flex-none">
                          <Trash2 aria-hidden="true" size={14} />
                        </button>
                      </div>
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
