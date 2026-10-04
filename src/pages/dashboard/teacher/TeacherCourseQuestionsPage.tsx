import { Suspense, lazy, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, Modal, PageHeader, Pill } from '@/components/dashboard/DashboardUI';
import { useAuth, useResource } from '@/context/AuthContext';
import { apiPost } from '@/lib/api';
import { ROUTES } from '@/routes/paths';
import { HelpCircle, Plus } from 'lucide-react';

const QuestionEditor = lazy(() => import('@/lib/mdxEditor').then((m) => ({ default: m.NewsEditor })));

type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_IN_THE_BLANK';

interface QuestionItem {
  id: string;
  type: QuestionType;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
  explanation?: string | null;
  classId?: string | null;
}

const inputClass = 'mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500';

export const TeacherCourseQuestionsPage = () => {
  const [params] = useSearchParams();
  const subjectId = params.get('subjectId') ?? '';
  const classId = params.get('classId') ?? '';
  const examId = params.get('examId') ?? '';
  const { user } = useAuth();
  const { data, loading, error, reload } = useResource<QuestionItem[]>('/questions', {
    examId: examId || undefined,
    subjectId: subjectId || undefined,
    limit: 200,
  });
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ type: 'MULTIPLE_CHOICE' as QuestionType, question: '', correct_answer: '', incorrect: '', explanation: '' });
  const [editorKey, setEditorKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const list = (data ?? []).filter(
    (q) =>
      (!classId || q.classId === classId) &&
      q.question.toLowerCase().includes(search.toLowerCase()),
  );

  const openCreate = () => {
    setForm({ type: 'MULTIPLE_CHOICE', question: '', correct_answer: '', incorrect: '', explanation: '' });
    setNotice(null);
    setEditorKey((k) => k + 1);
    setModalOpen(true);
  };

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
      await apiPost('/questions', {
        type: form.type,
        question: form.question.trim(),
        correct_answer: form.correct_answer.trim(),
        incorrect_answers: form.type === 'FILL_IN_THE_BLANK' ? [] : incorrectAnswers(),
        explanation: form.explanation.trim() || undefined,
        examId: examId || undefined,
        subjectId: subjectId || undefined,
        classId: classId || undefined,
        workspaceId: user?.workspaceId,
      });
      setNotice('Question added to this course.');
      setModalOpen(false);
      reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Assigned Courses · Questions"
        title="Questions"
        text="Every question in this course. Add new ones with the button below."
        actions={
          <button type="button" onClick={openCreate} className="inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
            <Plus aria-hidden="true" size={16} className="mr-2" /> Add New Question
          </button>
        }
      />
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link to={ROUTES.teacherClasses} className="font-bold text-brand-700 hover:text-brand-500">Assigned Courses</Link>
        <span className="px-2">/</span>
        <span className="text-ink" aria-current="page">Questions</span>
      </nav>
      {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

      <Card>
        <CardHead title="Question bank" sub={`${list.length} shown`} />
        <div className="border-b border-line px-5 py-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search question text…"
            aria-label="Search questions"
            className="min-h-11 w-full max-w-sm rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        {loading ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={4} /></div>
        ) : error || !data ? (
          <div className="px-5 py-5"><ErrorState message={error ?? 'No data'} onRetry={reload} /></div>
        ) : list.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message={search ? 'No questions match your search.' : 'No questions yet — add the first one for this course.'} /></div>
        ) : (
          <ul className="divide-y divide-line">
            {list.map((q, i) => (
              <li key={q.id} className="px-5 py-4">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                    <HelpCircle size={16} aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold">
                      <span className="mr-2 text-muted">Q{i + 1}.</span>
                      {q.question}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      Answer: <b className="text-emerald-700">{q.correct_answer}</b>
                      {q.incorrect_answers?.length > 0 && <> · Options: {q.incorrect_answers.join(' / ')}</>}
                    </p>
                    {q.explanation && <p className="mt-1 text-xs italic text-muted">{q.explanation}</p>}
                    <p className="mt-2"><Pill tone="sky">{q.type.replace(/_/g, ' ')}</Pill></p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Question">
        <form onSubmit={save} className="space-y-4">
          <label className="block text-sm font-semibold">Question type
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as QuestionType })} className={inputClass}>
              <option value="MULTIPLE_CHOICE">Multiple choice</option>
              <option value="TRUE_FALSE">True / False</option>
              <option value="FILL_IN_THE_BLANK">Fill in the blank</option>
            </select>
          </label>
          <div>
            <p className="text-sm font-semibold">Question text</p>
            <div className="mt-2">
              <Suspense fallback={<LoadingSkeleton rows={3} />}>
                <QuestionEditor key={editorKey} initialValue={form.question} onChange={(md) => setForm({ ...form, question: md })} />
              </Suspense>
            </div>
          </div>
          <label className="block text-sm font-semibold">Correct answer
            <input value={form.correct_answer} onChange={(e) => setForm({ ...form, correct_answer: e.target.value })} required placeholder="The right answer" className={`${inputClass} text-sm`} />
          </label>
          {form.type !== 'FILL_IN_THE_BLANK' && (
            <label className="block text-sm font-semibold">
              {form.type === 'TRUE_FALSE' ? 'Opposite answer (exactly one)' : 'Incorrect options (one per line)'}
              <textarea rows={3} value={form.incorrect} onChange={(e) => setForm({ ...form, incorrect: e.target.value })} placeholder={form.type === 'TRUE_FALSE' ? 'e.g. False' : 'e.g. Paris\nLondon\nBerlin'} className="mt-2 w-full rounded border border-line bg-white px-3 py-3 text-sm outline-none focus:border-brand-500" />
            </label>
          )}
          <label className="block text-sm font-semibold">Explanation (optional)
            <textarea rows={2} value={form.explanation} onChange={(e) => setForm({ ...form, explanation: e.target.value })} placeholder="Why is this the answer?" className="mt-2 w-full rounded border border-line bg-white px-3 py-3 text-sm outline-none focus:border-brand-500" />
          </label>
          <div className="flex gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="min-h-11 flex-1 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="min-h-11 flex-1 rounded bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
              {busy ? 'Saving…' : 'Add Question'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
