import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Card, CardHead, EmptyState, ErrorState, LoadingSkeleton,
  Modal, PageHeader, Pagination,
} from '@/components/dashboard/DashboardUI';
import { useAuth, useResource } from '@/context/AuthContext';
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api';
import { usePagedList } from '@/lib/pagedQuery';
import { ROUTES } from '@/routes/paths';
import {
  BookOpen, Check, CheckSquare, ChevronDown, ChevronRight, ChevronUp,
  Download, HelpCircle, Loader2, Pencil, Plus, Square, Trash2,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SubjectItem {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  classes?: Array<{ id: string; name: string }>;
  _count?: { questions?: number };
}

interface ExamInfo {
  id: string;
  exam_name: string;
}

interface SourceExam {
  id: string;
  exam_name: string;
  _count?: { subjects?: number; questions?: number };
}

interface ImportQuestion {
  id: string;
  question: string;
  type: string;
}

interface ImportSubject {
  id: string;
  name: string;
  code?: string | null;
  _count?: { questions?: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const inputClass = 'mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500';

const toggle = (set: Set<string>, id: string): Set<string> => {
  const next = new Set(set);
  next.has(id) ? next.delete(id) : next.add(id);
  return next;
};

// ─── Import Dialog ────────────────────────────────────────────────────────────

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  targetExamId: string;
  classId: string;
  onSuccess: (msg: string) => void;
}

const ImportDialog = ({ open, onClose, targetExamId, classId, onSuccess }: ImportDialogProps) => {
  // Step 1: pick source exam / Step 2: pick subjects + questions
  const [step, setStep] = useState<'exam' | 'subjects'>('exam');
  const [sourceExams, setSourceExams] = useState<SourceExam[]>([]);
  const [examsLoading, setExamsLoading] = useState(false);

  const [sourceExamId, setSourceExamId] = useState('');
  const [importSubjects, setImportSubjects] = useState<ImportSubject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  // per-subject expanded state + loaded questions
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [questionsBySubject, setQuestionsBySubject] = useState<Record<string, ImportQuestion[]>>({});
  const [questionsLoading, setQuestionsLoading] = useState<Set<string>>(new Set());

  // selections
  const [checkedSubjects, setCheckedSubjects] = useState<Set<string>>(new Set());
  const [checkedQuestions, setCheckedQuestions] = useState<Set<string>>(new Set());

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset on open/close
  useEffect(() => {
    if (open) {
      setStep('exam');
      setSourceExamId('');
      setImportSubjects([]);
      setExpanded(new Set());
      setQuestionsBySubject({});
      setCheckedSubjects(new Set());
      setCheckedQuestions(new Set());
      setError(null);
    }
  }, [open]);

  // Load other exams in this class on open
  useEffect(() => {
    if (!open) return;
    setExamsLoading(true);
    apiGet<SourceExam[]>('/exams', { classId, limit: 100 })
      .then((res) => {
        // Exclude the target exam itself
        setSourceExams((res.data ?? []).filter((e) => e.id !== targetExamId));
      })
      .catch(() => setError('Could not load exams in this class.'))
      .finally(() => setExamsLoading(false));
  }, [open, classId, targetExamId]);

  // Step 1 → Step 2: load subjects for the chosen exam
  const goToSubjects = async () => {
    if (!sourceExamId) return;
    setSubjectsLoading(true);
    setError(null);
    try {
      const res = await apiGet<SubjectItem[]>('/subjects', { examId: sourceExamId, limit: 100 });
      setImportSubjects(res.data ?? []);
      setStep('subjects');
    } catch {
      setError('Could not load subjects for that exam.');
    } finally {
      setSubjectsLoading(false);
    }
  };

  // Expand a subject and load its questions on demand
  const toggleExpand = useCallback(async (subjectId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(subjectId) ? next.delete(subjectId) : next.add(subjectId);
      return next;
    });
    if (!questionsBySubject[subjectId]) {
      setQuestionsLoading((prev) => new Set(prev).add(subjectId));
      try {
        const res = await apiGet<ImportQuestion[]>('/questions', {
          examId: sourceExamId,
          subjectId,
          limit: 500,
        });
        setQuestionsBySubject((prev) => ({ ...prev, [subjectId]: res.data ?? [] }));
      } catch {
        setQuestionsBySubject((prev) => ({ ...prev, [subjectId]: [] }));
      } finally {
        setQuestionsLoading((prev) => { const n = new Set(prev); n.delete(subjectId); return n; });
      }
    }
  }, [questionsBySubject, sourceExamId]);

  // Subject-level select-all toggle
  const toggleSubjectAll = (subject: ImportSubject) => {
    const qs = questionsBySubject[subject.id] ?? [];
    const allChecked = qs.length > 0 && qs.every((q) => checkedQuestions.has(q.id));
    const nextSubjects = toggle(checkedSubjects, subject.id);
    setCheckedSubjects(nextSubjects);
    setCheckedQuestions((prev) => {
      const next = new Set(prev);
      if (allChecked) {
        qs.forEach((q) => next.delete(q.id));
      } else {
        qs.forEach((q) => next.add(q.id));
      }
      return next;
    });
  };

  // Select / deselect all subjects at once
  const selectAllSubjects = () => {
    if (checkedSubjects.size === importSubjects.length) {
      setCheckedSubjects(new Set());
      setCheckedQuestions(new Set());
    } else {
      setCheckedSubjects(new Set(importSubjects.map((s) => s.id)));
      // Don't auto-check questions — user can expand each to fine-tune
    }
  };

  const totalSelectedQ = checkedQuestions.size;

  // Submit import
  const doImport = async () => {
    if (checkedSubjects.size === 0) {
      setError('Select at least one subject to import.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const items = [...checkedSubjects].map((subjectId) => ({
        subjectId,
        questionIds: (questionsBySubject[subjectId] ?? [])
          .filter((q) => checkedQuestions.has(q.id))
          .map((q) => q.id),
      }));
      const res = await apiPost<{ imported: { subjects: number; questions: number } }>(
        `/exams/${targetExamId}/import`,
        { sourceExamId, items },
      );
      const { subjects, questions } = res.data.imported;
      onSuccess(`Imported ${subjects} subject(s) and ${questions} question(s) successfully.`);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Import failed. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Import from Another Exam">
      {/* ── Step 1: Pick source exam ── */}
      {step === 'exam' && (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Choose an exam <strong>in this class</strong> to import subjects and questions from.
          </p>

          {examsLoading ? (
            <LoadingSkeleton rows={3} />
          ) : sourceExams.length === 0 ? (
            <p className="rounded border border-line bg-cream px-4 py-6 text-center text-sm text-muted">
              No other exams found in this class.
            </p>
          ) : (
            <ul className="divide-y divide-line rounded border border-line">
              {sourceExams.map((exam) => (
                <li key={exam.id}>
                  <button
                    type="button"
                    onClick={() => setSourceExamId(exam.id)}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-brand-50 ${
                      sourceExamId === exam.id ? 'bg-brand-50' : ''
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                        sourceExamId === exam.id
                          ? 'border-brand-500 bg-brand-500 text-white'
                          : 'border-line'
                      }`}
                    >
                      {sourceExamId === exam.id && <Check size={11} aria-hidden="true" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-ink">{exam.exam_name}</span>
                      <span className="text-xs text-muted">
                        {exam._count?.subjects ?? 0} subjects · {exam._count?.questions ?? 0} questions
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {error && <p role="alert" className="border-l-2 border-rose-400 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="min-h-11 flex-1 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink">
              Cancel
            </button>
            <button
              type="button"
              onClick={goToSubjects}
              disabled={!sourceExamId || subjectsLoading}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {subjectsLoading && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
              Next — Pick Subjects
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Pick subjects + questions ── */}
      {step === 'subjects' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">
              Select the subjects (and optionally individual questions) to import.
            </p>
            <button
              type="button"
              onClick={selectAllSubjects}
              className="shrink-0 text-xs font-bold text-brand-700 hover:text-brand-500"
            >
              {checkedSubjects.size === importSubjects.length ? 'Deselect all' : 'Select all subjects'}
            </button>
          </div>

          {importSubjects.length === 0 ? (
            <p className="rounded border border-line bg-cream px-4 py-6 text-center text-sm text-muted">
              This exam has no subjects yet.
            </p>
          ) : (
            <ul className="max-h-[55vh] divide-y divide-line overflow-y-auto rounded border border-line">
              {importSubjects.map((subject) => {
                const isExpanded = expanded.has(subject.id);
                const isSubjectChecked = checkedSubjects.has(subject.id);
                const qs = questionsBySubject[subject.id];
                const isLoadingQs = questionsLoading.has(subject.id);
                const allQsChecked = qs && qs.length > 0 && qs.every((q) => checkedQuestions.has(q.id));
                const someQsChecked = qs && qs.some((q) => checkedQuestions.has(q.id));

                return (
                  <li key={subject.id}>
                    {/* Subject row */}
                    <div className="flex items-center gap-2 px-4 py-3">
                      {/* Subject checkbox */}
                      <button
                        type="button"
                        aria-label={`${isSubjectChecked ? 'Deselect' : 'Select'} subject ${subject.name}`}
                        onClick={() => toggleSubjectAll(subject)}
                        className="shrink-0 text-brand-600 hover:text-brand-900"
                      >
                        {isSubjectChecked && allQsChecked ? (
                          <CheckSquare size={18} aria-hidden="true" />
                        ) : isSubjectChecked || someQsChecked ? (
                          <CheckSquare size={18} aria-hidden="true" className="opacity-60" />
                        ) : (
                          <Square size={18} aria-hidden="true" className="text-muted" />
                        )}
                      </button>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{subject.name}</span>
                        <span className="text-xs text-muted">{subject._count?.questions ?? 0} questions</span>
                      </span>

                      {/* Expand/collapse toggle */}
                      <button
                        type="button"
                        onClick={() => toggleExpand(subject.id)}
                        aria-label={isExpanded ? 'Collapse questions' : 'Expand questions'}
                        className="flex shrink-0 items-center gap-1 rounded border border-line px-2 py-1 text-xs font-bold text-muted hover:border-brand-500 hover:text-brand-700"
                      >
                        {isLoadingQs
                          ? <Loader2 size={12} className="animate-spin" aria-hidden="true" />
                          : isExpanded
                          ? <ChevronUp size={12} aria-hidden="true" />
                          : <ChevronDown size={12} aria-hidden="true" />
                        }
                        Questions
                      </button>
                    </div>

                    {/* Questions list (expanded) */}
                    {isExpanded && (
                      <ul className="border-t border-line bg-cream">
                        {isLoadingQs ? (
                          <li className="px-8 py-3 text-xs text-muted">Loading questions…</li>
                        ) : !qs || qs.length === 0 ? (
                          <li className="px-8 py-3 text-xs text-muted">No questions in this subject.</li>
                        ) : (
                          <>
                            {/* Select all questions in subject */}
                            <li className="flex items-center gap-2 border-b border-line px-8 py-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const allSelected = qs.every((q) => checkedQuestions.has(q.id));
                                  setCheckedQuestions((prev) => {
                                    const next = new Set(prev);
                                    allSelected
                                      ? qs.forEach((q) => next.delete(q.id))
                                      : qs.forEach((q) => next.add(q.id));
                                    return next;
                                  });
                                  if (!isSubjectChecked) setCheckedSubjects((p) => new Set(p).add(subject.id));
                                }}
                                className="text-xs font-bold text-brand-700 hover:text-brand-500"
                              >
                                {qs.every((q) => checkedQuestions.has(q.id)) ? 'Deselect all' : 'Select all'} ({qs.length})
                              </button>
                            </li>
                            {qs.map((q) => (
                              <li key={q.id} className="flex items-start gap-2 border-b border-line px-8 py-2 last:border-b-0">
                                <button
                                  type="button"
                                  aria-label={`${checkedQuestions.has(q.id) ? 'Deselect' : 'Select'} question`}
                                  onClick={() => {
                                    setCheckedQuestions((prev) => toggle(prev, q.id));
                                    if (!isSubjectChecked) setCheckedSubjects((p) => new Set(p).add(subject.id));
                                  }}
                                  className="mt-0.5 shrink-0 text-brand-600 hover:text-brand-900"
                                >
                                  {checkedQuestions.has(q.id)
                                    ? <CheckSquare size={16} aria-hidden="true" />
                                    : <Square size={16} aria-hidden="true" className="text-muted" />
                                  }
                                </button>
                                <span className="line-clamp-2 text-xs text-ink">{q.question}</span>
                              </li>
                            ))}
                          </>
                        )}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          {/* Selection summary */}
          <p className="text-xs text-muted">
            <strong className="text-ink">{checkedSubjects.size}</strong> subject(s) selected
            {totalSelectedQ > 0 && <> · <strong className="text-ink">{totalSelectedQ}</strong> question(s) selected</>}
          </p>

          {error && <p role="alert" className="border-l-2 border-rose-400 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setStep('exam')} className="min-h-11 flex-1 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink">
              ← Back
            </button>
            <button
              type="button"
              onClick={doImport}
              disabled={busy || checkedSubjects.size === 0}
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {busy
                ? <><Loader2 size={14} className="animate-spin" aria-hidden="true" /> Importing…</>
                : <><Download size={14} aria-hidden="true" /> Import {checkedSubjects.size} Subject{checkedSubjects.size !== 1 ? 's' : ''}</>
              }
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

// ─── ExamSubjectsPage ─────────────────────────────────────────────────────────

export const ExamSubjectsPage = () => {
  const { classId = '', examId = '' } = useParams<{ classId: string; examId: string }>();
  const { user } = useAuth();
  const exam = useResource<ExamInfo>(examId ? `/exams/${examId}` : null);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  const subjects = usePagedList<SubjectItem>(
    ['exam-subjects', examId, query],
    (page, limit) => apiGet<SubjectItem[]>('/subjects', { examId, searchTerm: query || undefined, page, limit }),
  );

  // ── Create / Edit modal ────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SubjectItem | null>(null);
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // ── Import dialog ──────────────────────────────────────────────────────────
  const [importOpen, setImportOpen] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', code: '', description: '' });
    setNotice(null);
    setModalOpen(true);
  };

  const openEdit = (subject: SubjectItem) => {
    setEditing(subject);
    setForm({ name: subject.name, code: subject.code ?? '', description: subject.description ?? '' });
    setNotice(null);
    setModalOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setNotice('Enter a subject name.'); return; }
    setBusy(true);
    setNotice(null);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        description: form.description.trim() || undefined,
        workspaceId: user?.workspaceId,
        classIds: [classId],
        examIds: [examId],
      };
      if (editing) {
        await apiPut(`/subjects/${editing.id}`, payload);
        setNotice(`Subject "${form.name.trim()}" updated.`);
      } else {
        await apiPost('/subjects', payload);
        setNotice(`Subject "${form.name.trim()}" created under this exam's class.`);
      }
      setModalOpen(false);
      setEditing(null);
      subjects.invalidate();
    } catch (err: any) {
      setNotice(err?.message ?? 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (subject: SubjectItem) => {
    if (!confirm(`Delete subject "${subject.name}"? Its questions are removed too. This cannot be undone.`)) return;
    try {
      await apiDelete(`/subjects/${subject.id}`);
      setNotice(`Subject "${subject.name}" deleted.`);
      subjects.invalidate();
    } catch (err: any) {
      setNotice(err?.message ?? 'Delete failed');
    }
  };

  const examName = exam.data?.exam_name ?? 'Exam';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Exam & Test · ${examName}`}
        title={`Subjects — ${examName}`}
        text="Subjects in this exam. Select a subject to manage its questions."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="inline-flex min-h-11 items-center rounded border border-brand-500 px-4 py-2.5 text-sm font-bold text-brand-700 hover:bg-brand-50"
            >
              <Download aria-hidden="true" size={16} className="mr-2" /> Import from Exam
            </button>
            <button type="button" onClick={openCreate} className="inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
              <Plus aria-hidden="true" size={16} className="mr-2" /> Add New Subject
            </button>
          </div>
        }
      />
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link to={ROUTES.adminExams} className="font-bold text-brand-700 hover:text-brand-500">Classes</Link>
        <span className="px-2">/</span>
        <Link to={`/dashboard/admin/exams/${classId}`} className="font-bold text-brand-700 hover:text-brand-500">
          {examName === 'Exam' ? 'Exams' : examName}
        </Link>
        <span className="px-2">/</span>
        <span className="text-ink" aria-current="page">Subjects</span>
      </nav>
      {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

      <Card>
        <CardHead title="Subjects in this exam" sub={`${subjects.total} shown`} />
        <form
          className="flex flex-wrap gap-2 border-b border-line px-5 py-4"
          onSubmit={(e) => { e.preventDefault(); setQuery(search); subjects.resetPage(); }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subject name or code…"
            aria-label="Search subjects"
            className="min-h-11 w-full max-w-sm rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500"
          />
          <button type="submit" className="min-h-11 rounded bg-brand-900 px-4 text-sm font-bold text-white hover:bg-brand-700">Search</button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setQuery(''); subjects.resetPage(); }} className="min-h-11 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink">
              Reset
            </button>
          )}
        </form>
        {subjects.isPending ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={4} /></div>
        ) : subjects.isError ? (
          <div className="px-5 py-5"><ErrorState message="Could not load subjects" onRetry={() => subjects.refetch()} /></div>
        ) : subjects.rows.length === 0 ? (
          <div className="px-5 py-5">
            <EmptyState message={query ? 'No subjects match your search.' : 'No subjects in this exam yet — add the first one or import from another exam.'} />
          </div>
        ) : (
          <>
            <ul className={`divide-y divide-line transition-opacity ${subjects.isFetching ? 'opacity-60' : ''}`}>
              {subjects.rows.map((subject) => (
                <li key={subject.id} className="group flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <Link to={`/dashboard/admin/exams/${classId}/${examId}/${subject.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 group-hover:bg-brand-500 group-hover:text-white">
                      <BookOpen size={18} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-display text-base font-extrabold group-hover:text-brand-700">
                        {subject.name}
                        {subject.code && <span className="ml-2 text-xs font-bold text-muted">{subject.code}</span>}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                        {subject.description && <span className="truncate">{subject.description}</span>}
                        {subject.description && <span>·</span>}
                        <span className="inline-flex items-center gap-1"><HelpCircle size={12} aria-hidden="true" /> {subject._count?.questions ?? 0} questions</span>
                      </span>
                    </span>
                    <ChevronRight size={16} aria-hidden="true" className="ml-auto shrink-0 text-muted group-hover:text-brand-700" />
                  </Link>
                  <span className="flex shrink-0 gap-2 border-t border-line pt-3 sm:border-t-0 sm:pt-0 sm:pl-4">
                    <button type="button" onClick={() => openEdit(subject)} aria-label={`Edit ${subject.name}`} title="Edit" className="rounded border border-line px-3 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700">
                      <Pencil aria-hidden="true" size={14} />
                    </button>
                    <button type="button" onClick={() => remove(subject)} aria-label={`Delete ${subject.name}`} title="Delete" className="rounded border border-line px-3 py-1.5 text-xs font-bold text-rose-700 hover:border-rose-300">
                      <Trash2 aria-hidden="true" size={14} />
                    </button>
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

      {/* ── Create / Edit Subject modal ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Subject' : 'New Subject'}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="text-sm font-semibold" htmlFor="subject-name">Subject Name</label>
            <input id="subject-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mathematics" required className={`${inputClass} text-sm`} />
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="subject-code">Code (optional)</label>
            <input id="subject-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. MTH101" className={`${inputClass} text-sm`} />
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="subject-description">Description (optional)</label>
            <textarea id="subject-description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does this subject cover?" className="mt-2 w-full rounded border border-line bg-white px-3 py-3 text-sm outline-none focus:border-brand-500" />
          </div>
          {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="min-h-11 flex-1 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink">Cancel</button>
            <button type="submit" disabled={busy} className="min-h-11 flex-1 rounded bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
              {busy ? 'Saving…' : editing ? 'Save Changes' : 'Create Subject'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Import dialog ── */}
      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        targetExamId={examId}
        classId={classId}
        onSuccess={(msg) => { setNotice(msg); subjects.invalidate(); }}
      />
    </div>
  );
};
