import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BookOpen, Check, ChevronRight, GraduationCap, Layers, UserRound } from 'lucide-react';
import { Modal } from '@/components/dashboard/DashboardUI';
import { SearchSelect, type SearchOption } from '@/components/dashboard/SearchSelect';
import { apiGet, apiPost } from '@/lib/api';
import type { ClassItem, ExamItem, StaffRow, SubjectItem } from '@/data/dashboard';

export interface InitialAssignTeacher {
  id: string;
  name: string;
  typeStatus?: string | null;
}

const teacherTypeLabel = (value?: string | null) =>
  value === 'PRINCIPAL' ? 'Principal' : value === 'CLASS_TEACHER' ? 'Class Teacher' : null;

const STEP_META = [
  { label: 'Teacher', icon: UserRound },
  { label: 'Class', icon: Layers },
  { label: 'Exam', icon: BookOpen },
  { label: 'Subject', icon: GraduationCap },
] as const;

export const CourseAssignmentWizard = ({
  open,
  onClose,
  initialTeacher,
  onAssigned,
}: {
  open: boolean;
  onClose: () => void;
  initialTeacher?: InitialAssignTeacher | null;
  onAssigned?: (message: string) => void;
}) => {
  const [step, setStep] = useState(0);
  const [teacherId, setTeacherId] = useState('');
  const [classId, setClassId] = useState('');
  const [examId, setExamId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const teachersQuery = useQuery({
    queryKey: ['assign-teachers'],
    queryFn: async () => (await apiGet<StaffRow[]>('/staff', { limit: 100 })).data,
    enabled: open,
    staleTime: 60_000,
  });
  const classesQuery = useQuery({
    queryKey: ['assign-classes'],
    queryFn: async () => (await apiGet<ClassItem[]>('/classes', { limit: 200 })).data,
    enabled: open,
    staleTime: 60_000,
  });
  const examsQuery = useQuery({
    queryKey: ['assign-exams', classId],
    queryFn: async () => (await apiGet<ExamItem[]>('/exams', { classId, limit: 100 })).data,
    enabled: open && Boolean(classId),
    staleTime: 60_000,
  });
  const subjectsQuery = useQuery({
    queryKey: ['assign-subjects', examId],
    queryFn: async () =>
      (await apiGet<SubjectItem[]>('/subjects', { examId, classId, limit: 100 })).data,
    enabled: open && Boolean(examId),
    staleTime: 60_000,
  });

  useEffect(() => {
    if (!open) return;
    setTeacherId(initialTeacher?.id ?? '');
    setStep(initialTeacher?.id ? 1 : 0);
    setClassId('');
    setExamId('');
    setSubjectId('');
    setBusy(false);
    setError(null);
    setSuccess(null);
  }, [open, initialTeacher?.id]);

  const teacherOptions = useMemo<SearchOption[]>(() => {
    const options = (teachersQuery.data ?? [])
      .filter((row) => row.role === 'TEACHER')
      .map((row) => ({
        id: row.id,
        label: row.user_name,
        hint: [row.user_email, teacherTypeLabel(row.teacher?.type_status)].filter(Boolean).join(' · '),
      }));

    if (initialTeacher && !options.some((option) => option.id === initialTeacher.id)) {
      options.unshift({
        id: initialTeacher.id,
        label: initialTeacher.name,
        hint: teacherTypeLabel(initialTeacher.typeStatus) ?? 'Teacher',
      });
    }
    return options;
  }, [teachersQuery.data, initialTeacher]);

  const classOptions = useMemo<SearchOption[]>(
    () => (classesQuery.data ?? []).map((row) => ({ id: row.id, label: row.name })),
    [classesQuery.data],
  );
  const examOptions = useMemo<SearchOption[]>(
    () =>
      (examsQuery.data ?? []).map((row) => ({
        id: row.id,
        label: row.exam_name,
        hint: `${row.minutes} minutes`,
      })),
    [examsQuery.data],
  );
  const subjectOptions = useMemo<SearchOption[]>(
    () =>
      (subjectsQuery.data ?? []).map((row) => ({
        id: row.id,
        label: row.name,
        hint: row.code ?? undefined,
      })),
    [subjectsQuery.data],
  );

  const teacher = teacherOptions.find((option) => option.id === teacherId) ?? null;
  const cls = classOptions.find((option) => option.id === classId) ?? null;
  const exam = examOptions.find((option) => option.id === examId) ?? null;
  const subject = subjectOptions.find((option) => option.id === subjectId) ?? null;

  const completed = [Boolean(teacherId), Boolean(classId), Boolean(examId), Boolean(subjectId)];
  const stepEnabled = [true, Boolean(teacherId), Boolean(classId), Boolean(examId)];

  const close = () => {
    if (busy) return;
    onClose();
  };

  const selectTeacher = (id: string) => {
    setTeacherId(id);
    setClassId('');
    setExamId('');
    setSubjectId('');
    setError(null);
    setStep(id ? 1 : 0);
  };

  const selectClass = (id: string) => {
    setClassId(id);
    setExamId('');
    setSubjectId('');
    setError(null);
    setStep(id ? 2 : 1);
  };

  const selectExam = (id: string) => {
    setExamId(id);
    setSubjectId('');
    setError(null);
    setStep(id ? 3 : 2);
  };

  const selectSubject = (id: string) => {
    setSubjectId(id);
    setError(null);
  };

  const assign = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!teacherId || !classId || !examId || !subjectId) {
      setError('Pick a teacher, class, exam and subject first.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await apiPost('/course-assignments', { teacherId, classId, examId, subjectId });
      const message = `${subject?.label ?? 'Subject'} assigned in ${exam?.label ?? 'the exam'} for ${
        teacher?.label ?? 'the teacher'
      }.`;
      setSuccess(message);
      onAssigned?.(message);
    } catch (err: any) {
      setError(err?.message ?? 'Could not assign course');
    } finally {
      setBusy(false);
    }
  };

  const assignAnother = () => {
    setSuccess(null);
    setClassId('');
    setExamId('');
    setSubjectId('');
    setError(null);
    setStep(1);
  };

  const nextEnabled =
    (step === 0 && Boolean(teacherId)) ||
    (step === 1 && Boolean(classId)) ||
    (step === 2 && Boolean(examId));

  return (
    <Modal open={open} onClose={close} title="Assign courses" size="lg">
      {success ? (
        <div className="space-y-4">
          <div className="border-l-2 border-lime-accent bg-brand-50 px-4 py-4 text-sm text-brand-800">
            <p className="flex items-center gap-2 font-extrabold">
              <Check size={16} aria-hidden="true" /> Course assigned
            </p>
            <p className="mt-1">{success}</p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={assignAnother}
              className="min-h-11 flex-1 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink"
            >
              Assign another course
            </button>
            <button
              type="button"
              onClick={close}
              className="min-h-11 flex-1 rounded bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-700"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={assign} className="space-y-5">
          <ol className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {STEP_META.map((meta, index) => {
              const Icon = meta.icon;
              const isActive = step === index;
              const isDone = completed[index];
              return (
                <li key={meta.label}>
                  <button
                    type="button"
                    disabled={!stepEnabled[index]}
                    onClick={() => setStep(index)}
                    aria-current={isActive ? 'step' : undefined}
                    className={`flex w-full items-center gap-2 rounded border px-3 py-2 text-left text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      isActive
                        ? 'border-brand-500 bg-brand-50 text-brand-800'
                        : isDone
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                          : 'border-line bg-white text-muted'
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                        isDone ? 'bg-emerald-600 text-white' : isActive ? 'bg-brand-500 text-white' : 'bg-cream text-muted'
                      }`}
                    >
                      {isDone ? <Check size={13} aria-hidden="true" /> : <Icon size={13} aria-hidden="true" />}
                    </span>
                    <span>
                      <span className="block text-[10px] uppercase tracking-widest opacity-70">Step {index + 1}</span>
                      {meta.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <p className="truncate border-l-2 border-brand-300 pl-3 text-xs text-muted">
            {teacher?.label ?? 'Choose a teacher'}
            {cls ? ` / ${cls.label}` : ''}
            {exam ? ` / ${exam.label}` : ''}
            {subject ? ` / ${subject.label}` : ''}
          </p>

          {step === 0 && (
            <div className="space-y-2">
              <SearchSelect
                label="Teacher"
                placeholder="Search by teacher name or email..."
                items={teacherOptions}
                value={teacherId}
                onChange={selectTeacher}
                loading={teachersQuery.isFetching}
                emptyText="No teacher accounts found."
              />
              <p className="text-xs text-muted">
                Pick a teacher to see their classes. Only teacher accounts can be assigned courses.
              </p>
              {teachersQuery.isError && (
                <p role="alert" className="border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                  Could not load teachers. Close and try again.
                </p>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-2">
              <SearchSelect
                label="Class"
                placeholder="Search classes..."
                items={classOptions}
                value={classId}
                onChange={selectClass}
                loading={classesQuery.isFetching}
                emptyText="No classes found."
              />
              <p className="text-xs text-muted">Choose the class, then pick the exam under it.</p>
              {classesQuery.isError && (
                <p role="alert" className="border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                  Could not load classes. Close and try again.
                </p>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <SearchSelect
                label="Exam"
                placeholder="Search exams in this class..."
                items={examOptions}
                value={examId}
                onChange={selectExam}
                loading={examsQuery.isFetching}
                emptyText={classId ? 'No exams in this class yet.' : 'Choose a class first.'}
              />
              <p className="text-xs text-muted">Choose the exam, then pick one of its subjects.</p>
              {examsQuery.isError && (
                <p role="alert" className="border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                  Could not load exams for this class.
                </p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <SearchSelect
                label="Subject"
                placeholder="Search subjects in this exam..."
                items={subjectOptions}
                value={subjectId}
                onChange={selectSubject}
                loading={subjectsQuery.isFetching}
                emptyText={examId ? 'No subjects in this exam yet.' : 'Choose an exam first.'}
              />
              {subjectsQuery.isError && (
                <p role="alert" className="border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                  Could not load subjects for this exam.
                </p>
              )}

              <div className="rounded border border-line bg-cream p-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Assignment summary</p>
                <dl className="mt-2 grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs text-muted">Teacher</dt>
                    <dd className="font-semibold text-ink">{teacher?.label ?? 'Not selected'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Class</dt>
                    <dd className="font-semibold text-ink">{cls?.label ?? 'Not selected'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Exam</dt>
                    <dd className="font-semibold text-ink">{exam?.label ?? 'Not selected'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted">Subject</dt>
                    <dd className="font-semibold text-ink">{subject?.label ?? 'Not selected'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          )}

          {error && (
            <p role="alert" className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <div>
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep((current) => Math.max(0, current - 1))}
                  className="inline-flex min-h-11 items-center gap-2 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink"
                >
                  <ArrowLeft size={15} aria-hidden="true" /> Back
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={close}
                className="min-h-11 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink"
              >
                Cancel
              </button>
              {step < 3 ? (
                <button
                  type="button"
                  disabled={!nextEnabled}
                  onClick={() => setStep((current) => Math.min(3, current + 1))}
                  className="inline-flex min-h-11 items-center gap-2 rounded bg-brand-500 px-5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  Next <ChevronRight size={15} aria-hidden="true" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!subjectId || busy}
                  className="inline-flex min-h-11 items-center gap-2 rounded bg-brand-500 px-5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
                >
                  <BookOpen size={15} aria-hidden="true" />
                  {busy ? 'Assigning...' : 'Assign course'}
                </button>
              )}
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
};
