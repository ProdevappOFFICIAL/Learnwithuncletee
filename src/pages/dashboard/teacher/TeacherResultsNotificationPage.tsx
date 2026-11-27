import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  ClipboardCheck,
  MessageSquareText,
  RefreshCw,
  UserRound,
} from 'lucide-react';
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  Pill,
} from '@/components/dashboard/DashboardUI';
import { useToast } from '@/components/ui/Toast';
import { useResource } from '@/context/AuthContext';
import { apiGet, apiPost } from '@/lib/api';
import { useAcademicSettings } from '@/lib/academic';
import type { StudentRow } from '@/data/dashboard';
import ReportCard, { type ReportSubject } from '@/components/ui/ReportCard';
import {
  applyPreviousTermScores,
  autoMapSources,
  blankDraft,
  cardToDraft,
  columnForExamName,
  detectVariant,
  draftToReportSubjects,
  previousTermOf,
  recalcSubject,
  subjectMatches,
  templateDraftSubjects,
  type SubjectAliasMap,
} from '@/pages/dashboard/admin/result-generator/helpers';
import type {
  AttendanceSummary,
  GeneratedReportCard,
  ReportCardDraft,
  SourceResult,
} from '@/pages/dashboard/admin/result-generator/types';
import { TeacherPupilsPanel } from './TeacherPupilsPanel';

interface TeacherAssignment {
  id: string;
  teacherId: string;
  classId: string;
  subjectId: string;
  examId: string;
  component: 'CBT1' | 'CBT2' | 'EXAM';
  class: { id: string; name: string };
  subject: { id: string; name: string; code?: string | null };
  exam: { id: string; exam_name: string };
}

interface TeacherContext {
  isPrincipal: boolean;
  isClassTeacher: boolean;
  canEditPrincipalComment: boolean;
  canEditClassTeacherRemark: boolean;
  classes: Array<{ id: string; name: string; canEditClassTeacherRemark: boolean }>;
  classTeacherClasses: Array<{ id: string; name: string }>;
  assignments: TeacherAssignment[];
  pupils: StudentRow[];
}

interface TestResultRow {
  id: string;
  overallScore: number;
  date: string;
  exam?: { exam_name: string };
  subjectScores?: Record<string, { correct: number; total: number }>;
  subjectNames?: Record<string, string>;
}

interface RowAssignment {
  subjectId: string;
  subjectName: string;
}

interface RowAccess {
  cbt1: RowAssignment | null;
  cbt2: RowAssignment | null;
  exam: RowAssignment | null;
  rowSubjectId: string | null;
  rowSubjectName: string | null;
}

type TeacherTask = 'exam' | 'remarks';

/** Fields a class teacher can complete on the result notification. */
const CLASS_TEACHER_FIELDS = [
  'classTeacherRemark',
  'newsLetter',
  'affective.puntuality',
  'affective.respect',
  'psychomotor.handwriting',
  'psychomotor.recreation',
] as const;

const teacherTextFieldPatch = (
  field: string,
  value: string,
): Partial<ReportCardDraft> | null => {
  if (field === 'classTeacherRemark') return { classTeacherRemark: value };
  if (field === 'newsLetter') return { newsLetter: value };
  if (field === 'principalComment') return { principalComment: value };
  if (field === 'affective.puntuality') return { affectivePuntuality: value };
  if (field === 'affective.respect') return { affectiveRespect: value };
  if (field === 'psychomotor.handwriting') return { psychomotorHandwriting: value };
  if (field === 'psychomotor.recreation') return { psychomotorRecreation: value };
  return null;
};

const isDesktopViewport = () =>
  typeof window !== 'undefined' && window.matchMedia('(min-width: 1280px)').matches;

const pupilClassId = (pupil: StudentRow | null) =>
  pupil?.classId ?? pupil?.class?.id ?? null;

const sourceFromResult = (row: TestResultRow, origin: 'ONLINE' | 'OFFLINE'): SourceResult => ({
  key: `${origin}:${row.id}`,
  origin,
  examName: row.exam?.exam_name ?? 'Exam',
  date: row.date,
  overallScore: row.overallScore,
  subjects: Object.entries(row.subjectScores ?? {}).map(([id, stats]) => ({
    id,
    name: row.subjectNames?.[id] ?? 'Unknown subject',
    correct: stats.correct,
    total: stats.total,
    percentage: stats.total > 0 ? (stats.correct / stats.total) * 100 : undefined,
  })),
});

const loadSources = async (
  studentId: string,
  session: string,
  term: string,
): Promise<SourceResult[]> => {
  const [online, offline] = await Promise.allSettled([
    apiGet<TestResultRow[]>('/results', { userId: studentId, session, term, limit: 50 }),
    apiGet<TestResultRow[]>('/offline-results', { userId: studentId, session, term, limit: 50 }),
  ]);
  const rows: SourceResult[] = [];
  if (online.status === 'fulfilled') {
    rows.push(...(online.value.data ?? []).map((row) => sourceFromResult(row, 'ONLINE')));
  }
  if (offline.status === 'fulfilled') {
    rows.push(...(offline.value.data ?? []).map((row) => sourceFromResult(row, 'OFFLINE')));
  }
  return rows
    .filter((row) => columnForExamName(row.examName) === 'exam')
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
};

const buildRowAccess = (
  subjects: ReportCardDraft['subjects'],
  assignments: TeacherAssignment[],
  aliases: SubjectAliasMap,
  classId: string | null,
): RowAccess[] => {
  // A teacher is assigned to a subject *within a class*. Two classes can have
  // same-named subjects with different IDs (e.g. BIO1 in SS1 and BIO2 in SS2),
  // so only this pupil's class assignments may grant access here. Otherwise a
  // row can resolve to another class's subject ID and the server rejects the
  // save even though the teacher was assigned to the subject.
  const classAssignments = classId
    ? assignments.filter((assignment) => assignment.classId === classId)
    : [];
  return subjects.map((row) => {
    const access: RowAccess = {
      cbt1: null,
      cbt2: null,
      exam: null,
      rowSubjectId: row.sourceSubjectId ?? null,
      rowSubjectName: row.sourceSubjectName ?? null,
    };
    for (const assignment of classAssignments) {
      // Match the printed template row, not a saved card's source field. An
      // older card can carry a stale/wrong sourceSubjectId; that must never
      // grant a teacher access to a different subject row.
      const score = subjectMatches(row.lines, assignment.subject.name, aliases);
      if (score < 40) continue;
      const key = assignment.component === 'CBT1' ? 'cbt1' : assignment.component === 'CBT2' ? 'cbt2' : 'exam';
      if (!access[key]) {
        access[key] = {
          subjectId: assignment.subjectId,
          subjectName: assignment.subject.name,
        };
      }
    }
    return access;
  });
};

export const TeacherResultsNotificationPage = () => {
  const toast = useToast();
  const academic = useAcademicSettings();
  const session = academic.data?.data.session ?? '';
  const term = academic.data?.data.term ?? '';
  const contextRes = useResource<TeacherContext>('/report-cards/teacher/context');
  const aliasesRes = useResource<SubjectAliasMap>('/settings/subject-aliases');
  const aliases = aliasesRes.data ?? {};

  const [isDesktop, setIsDesktop] = useState(isDesktopViewport);
  const [leftOpen, setLeftOpen] = useState(isDesktopViewport);
  const [task, setTask] = useState<TeacherTask | null>(null);
  const [search, setSearch] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [selectedPupil, setSelectedPupil] = useState<StudentRow | null>(null);
  const [draft, setDraft] = useState<ReportCardDraft | null>(null);
  const [loadingPupil, setLoadingPupil] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [notice, setNotice] = useState<{ text: string; tone: 'ok' | 'error' } | null>(null);
  const requestRef = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)');
    const onChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
      setLeftOpen(event.matches);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!notice) return;
    // Toast on phones/tablets; the inline notice below stays for xl screens.
    if (notice.tone === 'error') toast.error(notice.text);
    else toast.success(notice.text);
    const timer = window.setTimeout(() => setNotice(null), notice.tone === 'error' ? 6000 : 3500);
    return () => window.clearTimeout(timer);
  }, [notice, toast]);

  const context = contextRes.data;
  const pupils = context?.pupils ?? [];
  const classes = context?.classes ?? [];

  const examAssignments = useMemo(
    () => (context?.assignments ?? []).filter((assignment) => assignment.component === 'EXAM'),
    [context?.assignments],
  );
  const examClassIds = useMemo(
    () => new Set(examAssignments.map((assignment) => assignment.classId)),
    [examAssignments],
  );
  const classTeacherIds = useMemo(
    () => new Set((context?.classTeacherClasses ?? []).map((cls) => cls.id)),
    [context?.classTeacherClasses],
  );
  const canUseRemarksTask = classTeacherIds.size > 0 || Boolean(context?.canEditPrincipalComment);

  const taskClasses = useMemo(() => {
    if (task === 'exam') return classes.filter((cls) => examClassIds.has(cls.id));
    if (task === 'remarks') {
      return classes.filter(
        (cls) => cls.canEditClassTeacherRemark || Boolean(context?.canEditPrincipalComment),
      );
    }
    return [];
  }, [task, classes, examClassIds, context?.canEditPrincipalComment]);

  const taskClassIds = useMemo(
    () => new Set(taskClasses.map((cls) => cls.id)),
    [taskClasses],
  );

  const taskPupils = useMemo(
    () =>
      task
        ? pupils.filter((pupil) => {
            const classId = pupilClassId(pupil);
            return Boolean(classId && taskClassIds.has(classId));
          })
        : [],
    [pupils, task, taskClassIds],
  );

  const filteredPupils = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return taskPupils.filter((pupil) => {
      const classId = pupilClassId(pupil);
      if (classFilter && classId !== classFilter) return false;
      if (!needle) return true;
      return [pupil.user_name, pupil.user_email, pupil.student?.studentCode, pupil.student?.className]
        .some((value) => String(value ?? '').toLowerCase().includes(needle));
    });
  }, [taskPupils, search, classFilter]);

  const pupilsInClass = (classId: string) =>
    taskPupils.filter((pupil) => pupilClassId(pupil) === classId).length;

  const rowAccess = useMemo(
    () =>
      draft
        ? buildRowAccess(
            draft.subjects,
            context?.assignments ?? [],
            aliases,
            pupilClassId(selectedPupil),
          )
        : [],
    [draft, context?.assignments, aliases, selectedPupil],
  );

  const canEditClassTeacherRemark = useMemo(() => {
    const classId = pupilClassId(selectedPupil);
    if (!classId) return false;
    return Boolean(context?.classes.find((item) => item.id === classId)?.canEditClassTeacherRemark);
  }, [context?.classes, selectedPupil]);

  const highlightFields = useMemo(() => {
    const fields = new Set<string>();
    if (task === 'exam') {
      rowAccess.forEach((access, index) => {
        if (access.exam) fields.add(`subject.${index}.exam`);
      });
    }
    if (task === 'remarks' && canEditClassTeacherRemark && draft) {
      // Highlight the class-teacher boxes that still need to be filled.
      if (!draft.classTeacherRemark.trim()) fields.add('classTeacherRemark');
      if (!draft.newsLetter.trim()) fields.add('newsLetter');
      if (!draft.affectivePuntuality.trim()) fields.add('affective.puntuality');
      if (!draft.affectiveRespect.trim()) fields.add('affective.respect');
      if (!draft.psychomotorHandwriting.trim()) fields.add('psychomotor.handwriting');
      if (!draft.psychomotorRecreation.trim()) fields.add('psychomotor.recreation');
    }
    if (
      task === 'remarks' &&
      context?.canEditPrincipalComment &&
      draft &&
      !draft.principalComment.trim()
    ) {
      fields.add('principalComment');
    }
    return fields;
  }, [task, rowAccess, canEditClassTeacherRemark, context?.canEditPrincipalComment, draft]);

  const allowedFields = useMemo(() => {
    const fields = new Set<string>();
    if (task === 'exam') {
      rowAccess.forEach((access, index) => {
        if (access.exam) fields.add(`subject.${index}.exam`);
      });
    }
    if (task === 'remarks') {
      if (canEditClassTeacherRemark) {
        CLASS_TEACHER_FIELDS.forEach((field) => fields.add(field));
      }
      if (context?.canEditPrincipalComment) fields.add('principalComment');
    }
    return fields;
  }, [task, rowAccess, canEditClassTeacherRemark, context?.canEditPrincipalComment]);

  const canEditField = (field: string) => allowedFields.has(field);

  const handleLockedField = (field: string) => {
    if (/^subject\.\d+\.(cbt1|cbt2|exam|lastCum|ctotal|total|overall|label)$/.test(field)) {
      setNotice({
        text: 'You are not assigned to edit that subject score. Only the columns assigned to you can be changed.',
        tone: 'error',
      });
      return;
    }
    if (
      field === 'classTeacherRemark' ||
      field === 'newsLetter' ||
      field.startsWith('affective.') ||
      field.startsWith('psychomotor.')
    ) {
      setNotice({
        text: 'Only the class teacher for this pupil’s class can edit the remark, newsletter, punctuality, respect, handwriting and recreation boxes.',
        tone: 'error',
      });
      return;
    }
    if (field === 'principalComment') {
      setNotice({ text: 'Only a principal can edit the principal comment.', tone: 'error' });
      return;
    }
    setNotice({ text: 'This field is read-only on the teacher result page.', tone: 'error' });
  };

  const loadPupil = async (pupil: StudentRow) => {
    const requestId = ++requestRef.current;
    if (!session || !term) {
      setNotice({ text: 'The current session and term are not set in Settings.', tone: 'error' });
      return;
    }
    const detected = detectVariant(
      pupil.student?.combination?.name,
      pupil.student?.className ?? pupil.class?.name,
    );
    const base = blankDraft(pupil.id, detected, session, term, pupil);
    setSelectedPupil(pupil);
    setDraft(base);
    setLoadingPupil(true);
    setLastSavedAt(null);
    setNotice(null);
    if (!isDesktop) setLeftOpen(false);

    try {
      const previousTerm = previousTermOf(term);
      const previousPromise: Promise<GeneratedReportCard | null> = previousTerm
        ? apiGet<GeneratedReportCard | null>(`/report-cards/student/${pupil.id}`, {
            session,
            term: previousTerm,
          })
            .then((response) => response.data)
            .catch(() => null)
        : Promise.resolve(null);
      const [cardResponse, previousCard, sources] = await Promise.all([
        apiGet<GeneratedReportCard | null>(`/report-cards/student/${pupil.id}`, {
          session,
          term,
        }),
        previousPromise,
        loadSources(pupil.id, session, term).catch(() => []),
      ]);
      if (requestId !== requestRef.current) return;

      let nextDraft = cardResponse.data ? cardToDraft(cardResponse.data) : base;
      nextDraft = {
        ...nextDraft,
        subjects: templateDraftSubjects(
          nextDraft.variant,
          cardResponse.data ? nextDraft.subjects : [],
          aliases,
        ),
      };
      nextDraft = previousTerm
        ? applyPreviousTermScores(
            nextDraft,
            previousCard,
            Boolean(cardResponse.data),
            aliases,
          )
        : applyPreviousTermScores(nextDraft, null, false, aliases);
      nextDraft = autoMapSources(nextDraft, sources, {
        onlyBlank: Boolean(cardResponse.data),
        aliases,
      }).draft;

      setDraft(nextDraft);
      setLoadingPupil(false);

      try {
        const attendance = await apiGet<AttendanceSummary>('/report-cards/attendance', {
          studentId: pupil.id,
          term,
        });
        if (requestId !== requestRef.current) return;
        setDraft((previous) =>
          previous && previous.studentId === pupil.id
            ? {
                ...previous,
                attendanceFrom: attendance.data.from,
                attendanceTo: attendance.data.to,
                totalSchoolDays: attendance.data.totalSchoolDays,
                present: attendance.data.present,
                absent: attendance.data.absent,
              }
            : previous,
        );
      } catch {
        /* attendance is optional for this view */
      }
    } catch (error: any) {
      if (requestId !== requestRef.current) return;
      setLoadingPupil(false);
      setNotice({ text: error?.message ?? 'Could not load this pupil.', tone: 'error' });
    }
  };

  const commitTeacherField = async (field: string, value: string) => {
    if (!draft || !canEditField(field)) {
      handleLockedField(field);
      return;
    }

    const subjectField = /^subject\.(\d+)\.(cbt1|cbt2|exam)$/.exec(field);
    setSaving(true);
    setNotice(null);
    try {
      if (subjectField) {
        const index = Number(subjectField[1]);
        const part = subjectField[2] as 'cbt1' | 'cbt2' | 'exam';
        const access = rowAccess[index];
        const assignment = access?.[part];
        if (!assignment) {
          throw { message: 'You are not assigned to edit that subject score.' };
        }
        const max = part === 'exam' ? 60 : 20;
        const raw = value.trim();
        const parsed = raw === '' ? null : Number(raw);
        if (parsed !== null && !Number.isFinite(parsed)) return;
        const score = parsed === null ? null : Math.max(0, Math.min(max, parsed));
        const row = draft.subjects[index];
        const previousScore = row?.[part] ?? null;
        // An empty, never-filled box is not a score. Only save a clear when a
        // value already exists (the teacher deliberately emptied that cell).
        if (raw === '' && previousScore == null) {
          setNotice({
            text: 'Enter a score before saving. Type 0 if the pupil scored zero.',
            tone: 'error',
          });
          return;
        }
        if (score === previousScore) return;
        await apiPost<GeneratedReportCard>('/report-cards/teacher/cell', {
          studentId: draft.studentId,
          session: draft.session,
          term: draft.term,
          variant: draft.variant,
          field: part,
          value: score,
          subjectId: assignment.subjectId,
          subjectName: assignment.subjectName,
          rowSubjectId: access.rowSubjectId,
          rowSubjectName: access.rowSubjectName,
          rowPosition: index,
          lines: row?.lines ?? [],
        });
        setDraft((previous) =>
          previous
            ? {
                ...previous,
                subjects: previous.subjects.map((subject, subjectIndex) =>
                  subjectIndex === index
                    ? recalcSubject(subject, { [part]: score } as Partial<typeof subject>)
                    : subject,
                ),
              }
            : previous,
        );
      } else if (teacherTextFieldPatch(field, value)) {
        const patch = teacherTextFieldPatch(field, value)!;
        const [patchKey, patchValue] = Object.entries(patch)[0] ?? [];
        const currentValue = patchKey ? (draft as Record<string, any>)[patchKey] : undefined;
        // Blurring an empty text box should not create or overwrite a blank
        // value; an existing remark can still be cleared deliberately.
        if (!value.trim() && !String(currentValue ?? '').trim()) return;
        if (String(currentValue ?? '') === String(patchValue ?? '')) return;
        await apiPost<GeneratedReportCard>('/report-cards/teacher/cell', {
          studentId: draft.studentId,
          session: draft.session,
          term: draft.term,
          variant: draft.variant,
          field,
          value,
        });
        setDraft((previous) => (previous ? { ...previous, ...patch } : previous));
      } else {
        handleLockedField(field);
        return;
      }
      setLastSavedAt(new Date());
    } catch (error: any) {
      setNotice({ text: error?.message ?? 'Could not save this change.', tone: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const openTask = (next: TeacherTask) => {
    setTask(next);
    setClassFilter('');
    setSearch('');
    setSelectedPupil(null);
    setDraft(null);
    setNotice(null);
    setLastSavedAt(null);
    setLeftOpen(true);
  };

  const backToTasks = () => {
    setTask(null);
    setClassFilter('');
    setSearch('');
    setSelectedPupil(null);
    setDraft(null);
    setNotice(null);
    setLastSavedAt(null);
    setLeftOpen(false);
  };

  const changeClassFilter = (value: string) => {
    setClassFilter(value);
    if (selectedPupil && value && pupilClassId(selectedPupil) !== value) {
      setSelectedPupil(null);
      setDraft(null);
    }
  };

  const toggleLeft = () => setLeftOpen((value) => !value);

  if (academic.isPending || contextRes.loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-cream" />
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (academic.isError || !academic.data?.data || contextRes.error || !context) {
    return (
      <div className="space-y-4">
        <ErrorState
          message={
            academic.isError
              ? 'Could not load the academic period from Settings.'
              : contextRes.error ?? 'Could not load your result notification classes.'
          }
          onRetry={() => {
            void academic.refetch();
            contextRes.reload();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          {task && (
            <button
              type="button"
              onClick={backToTasks}
              className="mb-2 inline-flex min-h-8 items-center gap-1.5 rounded border border-line bg-white px-2.5 text-[11px] font-bold text-brand-800 hover:border-brand-500 hover:text-brand-700"
            >
              <ArrowLeft size={13} aria-hidden="true" /> All tasks
            </button>
          )}
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand-700">Reports</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">
            {task === 'exam'
              ? 'Examination Scores'
              : task === 'remarks'
                ? 'Class Teacher Remarks'
                : 'Result Notification'}
          </h1>
          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted sm:text-sm">
            {task === 'exam'
              ? 'Choose a class, open a pupil, then enter only the Examination scores assigned to you. Changes save automatically.'
              : task === 'remarks'
                ? 'Choose a class, open a pupil, then complete the class teacher remark, newsletter, punctuality, respect, handwriting and recreation boxes.'
                : 'Choose Examination Scores or Class Teacher Remarks to open the matching class list and result sheet.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {task === 'exam' && <Pill tone="violet">Examination only</Pill>}
          {task === 'remarks' && classTeacherIds.size > 0 && <Pill tone="emerald">Class teacher</Pill>}
          {context.isPrincipal && <Pill tone="violet">Principal</Pill>}
          <span className="inline-flex min-h-9 items-center rounded border border-line bg-brand-50 px-2.5 text-xs font-bold text-brand-900">
            {session} · {term}
          </span>
          {task && (
            <span
              className={`inline-flex min-h-9 items-center rounded px-2.5 text-[10px] font-bold uppercase tracking-wide ${
                saving ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'
              }`}
            >
              {saving ? 'Saving…' : lastSavedAt ? 'Saved' : 'Auto-save'}
            </span>
          )}
          {task && (
            <button
              type="button"
              onClick={toggleLeft}
              className="inline-flex min-h-9 items-center gap-1.5 rounded border border-line bg-white px-3 text-xs font-bold text-brand-800 hover:border-brand-500 hover:text-brand-700"
            >
              <UserRound size={14} aria-hidden="true" /> Pupils
            </button>
          )}
        </div>
      </div>

      {notice && (
        <p
          role="status"
          className={`hidden border-l-2 px-4 py-3 text-sm xl:block ${
            notice.tone === 'error'
              ? 'border-rose-400 bg-rose-50 text-rose-800'
              : 'border-lime-accent bg-brand-50 text-brand-800'
          }`}
        >
          {notice.text}
        </p>
      )}

      {!task && (
        <section className="border border-line bg-white">
          <div className="border-b border-line px-4 py-4 md:px-6">
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-brand-700">
              Result tasks
            </p>
            <h2 className="mt-1 font-display text-lg font-extrabold text-ink">
              What would you like to work on?
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted">
              Pick a task to open its class filter. You will only see pupils in the classes that
              task covers.
            </p>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-2 md:p-6">
            <button
              type="button"
              onClick={() => openTask('exam')}
              disabled={!examAssignments.length}
              className="group flex flex-col rounded border border-line bg-cream/40 p-4 text-left transition-colors hover:border-brand-500 hover:bg-brand-50/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex w-full items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded bg-brand-900 text-white">
                  <ClipboardCheck size={20} aria-hidden="true" />
                </span>
                <ChevronRight
                  size={18}
                  className="text-muted transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
              <span className="mt-4 block font-display text-lg font-extrabold text-ink">
                Examination Scores
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted">
                Enter the Examination column for the subjects assigned to you. CBT 1, CBT 2 and
                calculated columns stay locked.
              </span>
              <span className="mt-3 block text-[11px] font-bold text-brand-700">
                {examAssignments.length} subject assignment
                {examAssignments.length === 1 ? '' : 's'} · {examClassIds.size} class
                {examClassIds.size === 1 ? '' : 'es'}
              </span>
              <span className="mt-auto block pt-3 text-[11px] font-bold text-brand-900">
                {examAssignments.length
                  ? 'Open exam scores'
                  : 'No Examination subjects assigned yet'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => openTask('remarks')}
              disabled={!canUseRemarksTask}
              className="group flex flex-col rounded border border-line bg-cream/40 p-4 text-left transition-colors hover:border-brand-500 hover:bg-brand-50/40 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex w-full items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded bg-emerald-700 text-white">
                  <MessageSquareText size={20} aria-hidden="true" />
                </span>
                <ChevronRight
                  size={18}
                  className="text-muted transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
              <span className="mt-4 block font-display text-lg font-extrabold text-ink">
                Class Teacher Remarks
              </span>
              <span className="mt-1 block text-xs leading-5 text-muted">
                Complete the class teacher remark, newsletter, punctuality, respect for authority,
                handwriting and recreation boxes for your class.
              </span>
              <span className="mt-3 block text-[11px] font-bold text-emerald-800">
                {classTeacherIds.size} class{classTeacherIds.size === 1 ? '' : 'es'} as class
                teacher
              </span>
              <span className="mt-auto block pt-3 text-[11px] font-bold text-brand-900">
                {canUseRemarksTask
                  ? 'Open class teacher remarks'
                  : 'You are not a class teacher yet'}
              </span>
            </button>
          </div>
          <p className="border-t border-line px-4 py-3 text-[11px] leading-5 text-muted md:px-6">
            Yellow dotted boxes mark the fields you can edit. Exam boxes are highlighted in the
            Examination Scores task; unfinished class-teacher boxes are highlighted in the Class
            Teacher Remarks task.
          </p>
        </section>
      )}

      {task && (
        <>
          {!isDesktop && leftOpen && (
            <button
              type="button"
              aria-label="Close pupil panel"
              onClick={() => setLeftOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] xl:hidden"
            />
          )}

          <div className="flex flex-col gap-3 xl:flex-row xl:items-start">
        <div
          className={
            leftOpen
              ? 'fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[min(90vw,360px)] max-w-full flex-col overflow-y-auto overscroll-contain bg-white shadow-2xl xl:static xl:z-auto xl:h-auto xl:w-[300px] xl:overflow-visible xl:bg-transparent xl:shadow-none'
              : 'hidden'
          }
        >
          <TeacherPupilsPanel
            open={leftOpen}
            onToggle={toggleLeft}
            title={task === 'exam' ? 'Exam score classes' : 'Class teacher classes'}
            hint={
              task === 'exam'
                ? 'Choose a class, then a pupil. Only the Examination boxes for your assigned subjects can be edited.'
                : 'Choose a class, then a pupil. Complete the class teacher remark, newsletter and the affective/psychomotor boxes.'
            }
            search={search}
            onSearchChange={setSearch}
            classFilter={classFilter}
            onClassFilterChange={changeClassFilter}
            classes={taskClasses.map((item) => ({ id: item.id, name: item.name }))}
            pupils={filteredPupils}
            loading={contextRes.loading}
            selectedStudentId={selectedPupil?.id ?? ''}
            onSelectStudent={(pupil) => void loadPupil(pupil)}
          />
        </div>

        <main className="min-w-0 flex-1 space-y-3">
          <div className="border border-line bg-white px-3 py-3 sm:px-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-brand-700">
                  {task === 'exam' ? 'Examination scores' : 'Class teacher remarks'}
                </p>
                <p className="mt-0.5 text-sm font-bold text-ink">
                  {taskClasses.length} class{taskClasses.length === 1 ? '' : 'es'} ·{' '}
                  {taskPupils.length} pupil{taskPupils.length === 1 ? '' : 's'}
                </p>
              </div>
              <button
                type="button"
                onClick={backToTasks}
                className="inline-flex min-h-8 items-center gap-1.5 rounded border border-line px-2.5 text-[11px] font-bold text-brand-800 hover:border-brand-500 hover:text-brand-700"
              >
                <ArrowLeft size={13} aria-hidden="true" /> All tasks
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Filter by class">
              <button
                type="button"
                onClick={() => changeClassFilter('')}
                className={`inline-flex min-h-8 items-center gap-1 rounded border px-2.5 text-[11px] font-bold ${
                  classFilter
                    ? 'border-line bg-white text-brand-800 hover:border-brand-500'
                    : 'border-brand-900 bg-brand-900 text-white'
                }`}
              >
                All classes <span className="text-[10px] opacity-80">{taskPupils.length}</span>
              </button>
              {taskClasses.map((cls) => (
                <button
                  key={cls.id}
                  type="button"
                  onClick={() => changeClassFilter(cls.id)}
                  className={`inline-flex min-h-8 items-center gap-1 rounded border px-2.5 text-[11px] font-bold ${
                    classFilter === cls.id
                      ? 'border-brand-900 bg-brand-900 text-white'
                      : 'border-line bg-white text-brand-800 hover:border-brand-500'
                  }`}
                >
                  {cls.name}
                  <span className="text-[10px] opacity-80">{pupilsInClass(cls.id)}</span>
                </button>
              ))}
            </div>
            {!taskClasses.length && (
              <p className="mt-2 text-[11px] text-muted">
                No classes are available for this task yet.
              </p>
            )}
          </div>

          {!selectedPupil ? (
            <div className="border border-dashed border-line bg-white px-4 py-10">
              <EmptyState
                message={
                  task === 'exam'
                    ? 'Select a class or pupil to enter their Examination scores.'
                    : 'Select a class or pupil to complete their class teacher remarks.'
                }
              />
            </div>
          ) : loadingPupil || !draft ? (
            <div className="border border-line bg-white p-5">
              <LoadingSkeleton rows={8} />
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border border-line bg-brand-50/60 px-3 py-2 text-xs">
                <p className="text-brand-900">
                  <b>{draft.studentName || selectedPupil.user_name}</b>
                  {draft.className ? ` · ${draft.className}` : ''}
                  {draft.combinationName ? ` · ${draft.combinationName}` : ''}
                </p>
                <p className="text-brand-700">
                  {allowedFields.size > 0
                    ? `${allowedFields.size} editable field(s) on this sheet`
                    : task === 'exam'
                      ? 'No Examination subjects assigned to you on this sheet yet'
                      : 'No class teacher fields available on this sheet'}
                </p>
              </div>

              <div className="overflow-x-auto border border-line bg-cream p-3 md:p-5">
                <div className="mx-auto w-[794px]">
                  <ReportCard
                    variant={draft.variant}
                    term={draft.term}
                    session={draft.session}
                    studentName={draft.studentName}
                    admissionNumber={draft.admissionNumber}
                    className={draft.className}
                    photoUrl={draft.photoUrl}
                    subjects={draftToReportSubjects(draft) as ReportSubject[]}
                    present={draft.present}
                    absent={draft.absent}
                    totalSchoolDays={draft.totalSchoolDays}
                    affective={{
                      puntuality: draft.affectivePuntuality,
                      respect: draft.affectiveRespect,
                    }}
                    psychomotor={{
                      handwriting: draft.psychomotorHandwriting,
                      recreation: draft.psychomotorRecreation,
                    }}
                    classTeacherRemark={draft.classTeacherRemark}
                    principalComment={draft.principalComment}
                    newsLetter={draft.newsLetter}
                    nextTermBegins={draft.nextTermBegins}
                    grading={academic.data.data.grading}
                    canEditField={canEditField}
                    onLockedFieldClick={handleLockedField}
                    highlightFields={highlightFields}
                    onFieldCommit={(field, value) => void commitTeacherField(field, value)}
                  />
                </div>
              </div>
              <p className="text-center text-[10px] font-semibold text-muted">
                {task === 'exam'
                  ? 'Yellow dotted boxes are your assigned Examination scores.'
                  : 'Yellow dotted boxes still need a class-teacher entry.'}
              </p>
              <p className="text-center text-[10px] font-semibold text-muted xl:hidden">
                Swipe sideways to see the full result sheet.
              </p>
            </>
          )}
        </main>
          </div>
        </>
      )}

      {task && (
        <p className="flex items-center gap-1.5 text-[10px] text-muted">
          <RefreshCw size={11} aria-hidden="true" />
          {task === 'exam'
            ? 'Only the Examination subject scores assigned to you can be edited. CBT 1, CBT 2 and calculated columns stay locked.'
            : 'Only the class teacher for this pupil’s class can edit the remark, newsletter and the punctuality, respect, handwriting and recreation boxes. Calculated columns stay locked.'}
        </p>
      )}
    </div>
  );
};
