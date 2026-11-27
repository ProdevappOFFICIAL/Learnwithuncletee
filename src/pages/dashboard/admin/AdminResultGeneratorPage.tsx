import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, FilePlus2, Menu, Printer, Save, SlidersHorizontal, Upload, UserRound, X } from 'lucide-react';
import { ErrorState, LoadingSkeleton, PageHeader } from '@/components/dashboard/DashboardUI';
import { useToast } from '@/components/ui/Toast';
import { apiDownload, apiGet, apiPost, apiPut } from '@/lib/api';
import { useAcademicSettings } from '@/lib/academic';
import { downloadNodeAsPng } from '@/lib/studentIdCard';
import type { ClassItem, StudentRow } from '@/data/dashboard';
import ReportCard, { type ReportSubject } from '@/components/ui/ReportCard';
import { AdminResultGeneratorLeftPanel } from './result-generator/AdminResultGeneratorLeftPanel';
import { AdminResultGeneratorRightPanel } from './result-generator/AdminResultGeneratorRightPanel';
import { AdminResultGeneratorBottomPanel } from './result-generator/AdminResultGeneratorBottomPanel';
import { ImportResultsModal } from './result-generator/ImportResultsModal';
import {
  applyPreviousTermScores,
  autoMapSources,
  bestSubjectMatch,
  blankDraft,
  cardToDraft,
  detectVariant,
  draftPayload,
  draftToReportSubjects,
  mappedScore,
  previousTermOf,
  presetSubjects,
  recalcSubject,
  templateDraftSubjects,
  VARIANT_LABELS,
  type SubjectAliasMap,
} from './result-generator/helpers';
import type {
  AttendanceSummary,
  GeneratedReportCard,
  ImportedStudentRow,
  ReportCardDraft,
  ReportCardImportDetail,
  ReportCardImportSummary,
  ReportField,
  ReportVariant,
  SourceResult,
} from './result-generator/types';

interface TestResultRow {
  id: string;
  overallScore: number;
  date: string;
  exam?: { exam_name: string };
  subjectScores?: Record<string, { correct: number; total: number }>;
  subjectNames?: Record<string, string>;
}

const VARIANT_ORDER = Object.keys(VARIANT_LABELS) as ReportVariant[];

/**
 * A report card is only worth saving once the user has actually entered
 * something. Selecting a pupil and blurring empty boxes must not create a
 * blank card (or an autosave full of null scores).
 */
const hasReportContent = (draft: ReportCardDraft | null) => {
  if (!draft?.studentId) return false;
  const hasScore = draft.subjects.some(
    (subject) =>
      subject.cbt1 != null ||
      subject.cbt2 != null ||
      subject.exam != null ||
      subject.lastCum != null,
  );
  const hasText = [
    draft.classTeacherRemark,
    draft.principalComment,
    draft.newsLetter,
    draft.nextTermBegins,
    draft.affectivePuntuality,
    draft.affectiveRespect,
    draft.psychomotorHandwriting,
    draft.psychomotorRecreation,
  ].some((value) => String(value ?? '').trim().length > 0);
  return hasScore || hasText;
};

const isDesktopViewport = () =>
  typeof window !== 'undefined' && window.matchMedia('(min-width: 1280px)').matches;

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
  return rows.sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''));
};

export default function AdminResultGeneratorPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const requestRef = useRef(0);
  const attendanceRequestRef = useRef(0);
  const editRevisionRef = useRef(0);
  const lastAutosaveErrorRef = useRef<string | null>(null);
  const reportSheetRef = useRef<HTMLDivElement>(null);
  const academicQuery = useAcademicSettings();
  // The generator is locked to the current period chosen in Settings.
  const session = academicQuery.data?.data.session ?? '';
  const term = academicQuery.data?.data.term ?? '';
  const [variant, setVariant] = useState<ReportVariant>('junior');
  const [isDesktop, setIsDesktop] = useState(isDesktopViewport);
  const [leftOpen, setLeftOpen] = useState(isDesktopViewport);
  const [rightOpen, setRightOpen] = useState(isDesktopViewport);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [mode, setMode] = useState<'live' | 'import'>('live');
  const [studentSearch, setStudentSearch] = useState('');
  const [studentQuery, setStudentQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentRow | null>(null);
  const [selectedImportId, setSelectedImportId] = useState('');
  const [importedRow, setImportedRow] = useState<ImportedStudentRow | null>(null);
  const [selectedImportKey, setSelectedImportKey] = useState('');
  const [draft, setDraft] = useState<ReportCardDraft | null>(null);
  const [dirty, setDirty] = useState(false);
  const [selectedField, setSelectedField] = useState<ReportField | null>(null);
  const [sourceResults, setSourceResults] = useState<SourceResult[]>([]);
  const [selectedSourceKey, setSelectedSourceKey] = useState('');
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [attendanceBusy, setAttendanceBusy] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [selectionBusy, setSelectionBusy] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [downloadingImage, setDownloadingImage] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: 'ok' | 'error' } | null>(null);

  const classesQuery = useQuery({
    queryKey: ['generator-classes'],
    queryFn: async () => (await apiGet<ClassItem[]>('/classes', { limit: 200 })).data,
    staleTime: 60_000,
  });
  const studentsQuery = useQuery({
    queryKey: ['generator-students', studentQuery, classFilter],
    queryFn: async () =>
      (
        await apiGet<StudentRow[]>('/report-cards/pupils', {
          search: studentQuery || undefined,
          classId: classFilter || undefined,
          limit: 200,
        })
      ).data,
    staleTime: 30_000,
  });
  const importsQuery = useQuery({
    queryKey: ['report-card-imports'],
    queryFn: async () => (await apiGet<ReportCardImportSummary[]>('/report-cards/imports')).data,
    staleTime: 30_000,
  });
  const importDetailQuery = useQuery({
    queryKey: ['report-card-import', selectedImportId],
    queryFn: async () => (await apiGet<ReportCardImportDetail>(`/report-cards/imports/${selectedImportId}`)).data,
    enabled: Boolean(selectedImportId),
    staleTime: 60_000,
  });
  const aliasesQuery = useQuery({
    queryKey: ['subject-aliases'],
    queryFn: async () => (await apiGet<SubjectAliasMap>('/settings/subject-aliases')).data,
    staleTime: 60_000,
  });

  const subjectAliases = aliasesQuery.data ?? {};
  const subjectAliasesRef = useRef<SubjectAliasMap>({});
  subjectAliasesRef.current = subjectAliases;

  const classes = classesQuery.data ?? [];
  const students = studentsQuery.data ?? [];
  const imports = importsQuery.data ?? [];
  const importRows = importDetailQuery.data?.rows ?? [];
  const selectedStudentInList = students.find((item) => item.id === selectedStudent?.id) ?? null;
  const effectiveStudent = selectedStudentInList ?? selectedStudent;
  const previewDraft = useMemo(
    () => blankDraft('', variant, session, term, null),
    [variant, session, term],
  );
  const displayDraft = draft ?? previewDraft;
  const attachOptions = useMemo(
    () =>
      students.map((student) => ({
        id: student.id,
        label: student.user_name,
        hint: [student.student?.className, student.student?.combination?.name, student.user_email]
          .filter(Boolean)
          .join(' · '),
      })),
    [students],
  );

  useEffect(() => {
    if (!notice) return;
    // Toast is only rendered below xl; desktop keeps the inline notice below.
    if (notice.tone === 'error') toast.error(notice.text);
    else toast.success(notice.text);
    const timer = window.setTimeout(() => setNotice(null), notice.tone === 'error' ? 7000 : 4000);
    return () => window.clearTimeout(timer);
  }, [notice, toast]);

  useEffect(() => {
    if (classesQuery.isError) {
      setNotice({ text: 'Could not load classes.', tone: 'error' });
    }
  }, [classesQuery.isError]);

  useEffect(() => {
    if (studentsQuery.isError) {
      setNotice({ text: 'Could not load pupils.', tone: 'error' });
    }
  }, [studentsQuery.isError]);

  // Below xl the two side panels become slide-over drawers; above xl they sit
  // inline as before. Keep the rails open when returning to a desktop width.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1280px)');
    const onChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
      if (event.matches) {
        setLeftOpen(true);
        setRightOpen(true);
        setActionsOpen(false);
      } else {
        setLeftOpen(false);
        setRightOpen(false);
      }
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const toggleLeftPanel = () => {
    const next = !leftOpen;
    setLeftOpen(next);
    if (!isDesktop) {
      setRightOpen(false);
      setActionsOpen(false);
    }
  };

  const toggleRightPanel = () => {
    const next = !rightOpen;
    setRightOpen(next);
    if (!isDesktop) {
      setLeftOpen(false);
      setActionsOpen(false);
    }
  };

  const openActions = () => {
    setLeftOpen(false);
    setRightOpen(false);
    setActionsOpen(true);
  };

  const setLoadedDraft = (next: ReportCardDraft) => {
    setDraft(next);
    setVariant(next.variant);
    setDirty(false);
    setSelectedField(null);
  };

  /**
   * Attendance is derived from the register over the Settings term dates.
   * The generator never accepts manual date edits.
   */
  const fetchAttendance = async (studentId: string) => {
    if (!studentId || !term) return;
    const requestId = ++attendanceRequestRef.current;
    setAttendanceBusy(true);
    setAttendanceError(null);
    try {
      const response = await apiGet<AttendanceSummary>('/report-cards/attendance', { studentId, term });
      if (requestId !== attendanceRequestRef.current) return;
      setAttendance(response.data);
      setDraft((previous) =>
        previous && previous.studentId === studentId
          ? {
              ...previous,
              attendanceFrom: response.data.from,
              attendanceTo: response.data.to,
              totalSchoolDays: response.data.totalSchoolDays,
              present: response.data.present,
              absent: response.data.absent,
            }
          : previous,
      );
    } catch (error: any) {
      if (requestId !== attendanceRequestRef.current) return;
      setAttendanceError(error?.message ?? 'Could not calculate attendance');
    } finally {
      if (requestId === attendanceRequestRef.current) setAttendanceBusy(false);
    }
  };

  const loadStudent = async (
    student: StudentRow,
    options: { session?: string; term?: string; successMessage?: boolean } = {},
  ) => {
    const requestId = ++requestRef.current;
    const nextSession = options.session ?? session;
    const nextTerm = options.term ?? term;
    if (!nextSession || !nextTerm) {
      setNotice({ text: 'The current session and term are not set in Settings yet.', tone: 'error' });
      return;
    }
    const detected = detectVariant(student.student?.combination?.name, student.student?.className);
    const base = blankDraft(student.id, detected, nextSession, nextTerm, student);

    setMode('live');
    setSelectedStudent(student);
    setImportedRow(null);
    setSelectedImportKey('');
    setSelectionBusy(true);
    setSourceResults([]);
    setSelectedSourceKey('');
    setAttendance(null);
    setAttendanceError(null);
    setLoadedDraft(base);
    setNotice(null);

    try {
      const previousTerm = previousTermOf(nextTerm);
      const previousPromise: Promise<GeneratedReportCard | null> = previousTerm
        ? apiGet<GeneratedReportCard | null>(`/report-cards/student/${student.id}`, {
            session: nextSession,
            term: previousTerm,
          })
            .then((response) => response.data)
            .catch(() => null)
        : Promise.resolve(null);
      const [cardResponse, previousCard, sources] = await Promise.all([
        apiGet<GeneratedReportCard | null>(`/report-cards/student/${student.id}`, {
          session: nextSession,
          term: nextTerm,
        }),
        previousPromise,
        loadSources(student.id, nextSession, nextTerm).catch(() => []),
      ]);
      if (requestId !== requestRef.current) return;
      // Always start from the printed template rows. Saved scores are copied
      // into those fixed subject names through the mapper; result acronyms
      // never replace or rename a template row.
      let nextDraft = cardResponse.data ? cardToDraft(cardResponse.data) : base;
      nextDraft = {
        ...nextDraft,
        subjects: templateDraftSubjects(
          nextDraft.variant,
          cardResponse.data ? nextDraft.subjects : [],
          subjectAliasesRef.current,
        ),
      };
      nextDraft = previousTerm
        ? applyPreviousTermScores(
            nextDraft,
            previousCard,
            Boolean(cardResponse.data),
            subjectAliasesRef.current,
          )
        : applyPreviousTermScores(
            nextDraft,
            null,
            false,
            subjectAliasesRef.current,
          );
      // CBT 1 / CBT 2 / Exam results are separate sittings. Match the exam
      // names (e.g. "JSS1 CBT 1") and fill the matching score columns.
      const auto = autoMapSources(nextDraft, sources, {
        onlyBlank: Boolean(cardResponse.data),
        aliases: subjectAliasesRef.current,
      });
      nextDraft = auto.draft;
      setLoadedDraft(nextDraft);
      setSourceResults(sources);
      setSelectedSourceKey(sources[0]?.key ?? '');
      if (!isDesktop) setLeftOpen(false);
      void fetchAttendance(student.id);
      const columnLabel: Record<string, string> = {
        cbt1: 'CBT 1',
        cbt2: 'CBT 2',
        exam: 'Exam',
        lastCum: 'Last Cum.',
      };
      const autoNote =
        auto.mapped > 0
          ? `Auto-mapped ${auto.columns.map((column) => columnLabel[column]).join(', ')} from ${auto.sourcesUsed.join(', ')}.`
          : '';
      if (options.successMessage) {
        setNotice({
          text: `Loaded ${student.user_name}.${autoNote ? ` ${autoNote}` : ''}`,
          tone: 'ok',
        });
      } else if (autoNote) {
        setNotice({ text: autoNote, tone: 'ok' });
      }
    } catch (error: any) {
      if (requestId !== requestRef.current) return;
      setNotice({ text: error?.message ?? 'Could not load this pupil’s report card.', tone: 'error' });
    } finally {
      if (requestId === requestRef.current) setSelectionBusy(false);
    }
  };

  const loadImportedRow = async (row: ImportedStudentRow) => {
    const requestId = ++requestRef.current;
    if (!session || !term) {
      setNotice({ text: 'The current session and term are not set in Settings yet.', tone: 'error' });
      return;
    }
    setMode('import');
    setSelectedImportKey(row.key);
    setImportedRow(row);
    setSelectionBusy(true);
    setSelectedField(null);
    setAttendance(null);
    setAttendanceError(null);
    setNotice(null);

    let student = row.matchedStudentId
      ? students.find((item) => item.id === row.matchedStudentId) ?? null
      : null;
    if (!student && row.matchedStudentId) {
      try {
        student = (await apiGet<StudentRow>(`/students/${row.matchedStudentId}`)).data;
      } catch {
        student = null;
      }
    }

    const detected = detectVariant(
      row.matchedCombinationName || student?.student?.combination?.name,
      row.matchedClassName || row.className || student?.student?.className,
    );
    const base = blankDraft(row.matchedStudentId ?? '', detected, session, term, student);
    let nextDraft: ReportCardDraft = {
      ...base,
      studentEmail: row.userEmail || base.studentEmail,
      studentName: row.matchedStudentName || row.userName || base.studentName,
      admissionNumber: row.matchedAdmissionNumber || row.userId || base.admissionNumber,
      className: row.matchedClassName || row.className || base.className,
      photoUrl: row.matchedPhotoUrl || base.photoUrl,
      combinationName: row.matchedCombinationName || base.combinationName,
    };

    const previousTerm = previousTermOf(term);
    let previousCard: GeneratedReportCard | null = null;
    let hasSavedCard = false;
    if (row.matchedStudentId) {
      if (previousTerm) {
        try {
          previousCard =
            (
              await apiGet<GeneratedReportCard | null>(
                `/report-cards/student/${row.matchedStudentId}`,
                { session, term: previousTerm },
              )
            ).data ?? null;
        } catch {
          previousCard = null;
        }
      }
      try {
        const cardResponse = await apiGet<GeneratedReportCard | null>(
          `/report-cards/student/${row.matchedStudentId}`,
          { session, term },
        );
        if (cardResponse.data) {
          nextDraft = cardToDraft(cardResponse.data);
          hasSavedCard = true;
        }
      } catch {
        /* keep imported draft */
      }
    }
    // Keep the template's subject names. Imported acronyms are mapped into
    // those rows by autoMapSources, not turned into replacement rows.
    nextDraft = {
      ...nextDraft,
      subjects: templateDraftSubjects(
        nextDraft.variant,
        hasSavedCard ? nextDraft.subjects : [],
        subjectAliasesRef.current,
      ),
    };
    nextDraft = previousTerm
      ? applyPreviousTermScores(
          nextDraft,
          previousCard,
          hasSavedCard,
          subjectAliasesRef.current,
        )
      : applyPreviousTermScores(
          nextDraft,
          null,
          false,
          subjectAliasesRef.current,
        );

    const source: SourceResult = {
      key: `import:${row.key}`,
      origin: 'IMPORT',
      examName: row.examName || 'Imported results',
      overallScore: row.overallScore,
      subjects: row.subjects,
    };
    nextDraft = autoMapSources(nextDraft, [source], {
      onlyBlank: true,
      aliases: subjectAliasesRef.current,
    }).draft;

    if (requestId !== requestRef.current) return;
    setSelectedStudent(student);
    setLoadedDraft(nextDraft);
    if (row.matchedStudentId) void fetchAttendance(row.matchedStudentId);
    setSourceResults([source]);
    setSelectedSourceKey(source.key);
    if (!isDesktop) setLeftOpen(false);
    setSelectionBusy(false);
    setNotice({
      text: row.matchedStudentId
        ? `Loaded imported row for ${row.matchedStudentName || row.userName || 'pupil'}.`
        : 'Imported row is not matched to a pupil. Attach it in the inspector before saving.',
      tone: row.matchedStudentId ? 'ok' : 'error',
    });
  };

  const attachStudent = async (studentId: string) => {
    if (!studentId || attaching) return;
    setAttaching(true);
    try {
      const student = (await apiGet<StudentRow>(`/students/${studentId}`)).data;
      const detected = detectVariant(student.student?.combination?.name, student.student?.className);
      setSelectedStudent(student);
      setDraft((previous) => {
        if (!previous) return previous;
        return {
          ...previous,
          studentId,
          studentEmail: student.user_email,
          studentName: student.user_name,
          admissionNumber: student.student?.studentCode ?? previous.admissionNumber,
          className: student.student?.className ?? previous.className,
          photoUrl: student.student?.photoUrl ?? student.img ?? previous.photoUrl,
          combinationName: student.student?.combination?.name ?? previous.combinationName,
          variant: detected,
        };
      });
      setVariant(detected);
      markDirty();
      setNotice({ text: `Attached imported rows to ${student.user_name}.`, tone: 'ok' });
    } catch (error: any) {
      setNotice({ text: error?.message ?? 'Could not attach this pupil.', tone: 'error' });
    } finally {
      setAttaching(false);
    }
  };

  const markDirty = () => {
    editRevisionRef.current += 1;
    lastAutosaveErrorRef.current = null;
    setDirty(true);
  };

  const saveSubjectAliases = async (next: SubjectAliasMap) => {
    const response = await apiPut<SubjectAliasMap>('/settings/subject-aliases', {
      aliases: next,
    });
    const saved = response.data ?? next;
    queryClient.setQueryData(['subject-aliases'], saved);
    subjectAliasesRef.current = saved;

    // Apply the new mapping to any blank score boxes on the sheet that is
    // already open. Existing typed/saved scores are preserved.
    if (draft) {
      const auto = autoMapSources(draft, sourceResults, {
        onlyBlank: true,
        aliases: saved,
      });
      if (auto.mapped > 0) {
        setDraft(auto.draft);
        markDirty();
        setNotice({
          text: `Subject mappings saved. Filled ${auto.mapped} blank score(s) with the new mapping.`,
          tone: 'ok',
        });
        return;
      }
    }
    setNotice({
      text: 'Subject mappings saved. They apply to every auto-map.',
      tone: 'ok',
    });
  };

  const patchDraft = (patch: Partial<ReportCardDraft>) => {
    setDraft((previous) => {
      if (!previous) return previous;
      return { ...previous, ...patch };
    });
    markDirty();
  };

  const patchSubject = (index: number, patch: Partial<ReportCardDraft['subjects'][number]>) => {
    setDraft((previous) => {
      if (!previous) return previous;
      const current = previous.subjects[index];
      if (!current) return previous;
      const next = recalcSubject(current, patch);
      return {
        ...previous,
        subjects: previous.subjects.map((subject, subjectIndex) => (subjectIndex === index ? next : subject)),
      };
    });
    markDirty();
  };

  const handleFieldClick = (field: string) => {
    if (!draft) return;
    setSelectedField(field as ReportField);
    setRightOpen(true);
    if (!isDesktop) {
      setLeftOpen(false);
      setActionsOpen(false);
    }
  };

  /** Commit a value typed directly into a printed box on the sheet. */
  const commitInlineField = (field: string, value: string) => {
    if (!draft) return;
    const subjectField = /^subject\.(\d+)\.(label|cbt1|cbt2|exam|lastCum)$/.exec(field);
    if (subjectField) {
      const index = Number(subjectField[1]);
      const part = subjectField[2] as 'label' | 'cbt1' | 'cbt2' | 'exam' | 'lastCum';
      if (part === 'label') {
        const lines = value
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter(Boolean);
        patchSubject(index, { lines: lines.length ? lines : draft.subjects[index]?.lines ?? ['SUBJECT'] });
      } else {
        const max = part === 'exam' ? 60 : part === 'lastCum' ? 100 : 20;
        const raw = value.trim();
        const parsed = raw === '' ? null : Number(raw);
        if (parsed !== null && !Number.isFinite(parsed)) return;
        patchSubject(index, { [part]: parsed === null ? null : Math.max(0, Math.min(max, parsed)) } as Partial<
          ReportCardDraft['subjects'][number]
        >);
      }
      setSelectedField(field as ReportField);
      return;
    }

    const textFields: Record<string, (next: string) => void> = {
      studentName: (next) => patchDraft({ studentName: next }),
      admissionNumber: (next) => patchDraft({ admissionNumber: next }),
      className: (next) => patchDraft({ className: next }),
      classTeacherRemark: (next) => patchDraft({ classTeacherRemark: next }),
      principalComment: (next) => patchDraft({ principalComment: next }),
      newsLetter: (next) => patchDraft({ newsLetter: next }),
      'affective.puntuality': (next) => patchDraft({ affectivePuntuality: next }),
      'affective.respect': (next) => patchDraft({ affectiveRespect: next }),
      'psychomotor.handwriting': (next) => patchDraft({ psychomotorHandwriting: next }),
      'psychomotor.recreation': (next) => patchDraft({ psychomotorRecreation: next }),
    };
    textFields[field]?.(value);
    setSelectedField(field as ReportField);
  };

  const selectVariant = (next: ReportVariant) => {
    if (next === variant) return;
    const hasScores = draft?.subjects.some(
      (subject) =>
        subject.cbt1 != null ||
        subject.cbt2 != null ||
        subject.exam != null ||
        subject.lastCum != null,
    );
    if (draft && hasScores && !window.confirm('Switch template? The score rows will be replaced by the new section’s subject list.')) {
      return;
    }
    setVariant(next);
    if (draft) {
      setDraft({ ...draft, variant: next, subjects: presetSubjects(next) });
      markDirty();
      setSelectedField(null);
    }
  };

  const calculateAttendance = async () => {
    if (!draft?.studentId) {
      setAttendanceError('Attach this imported row to a pupil first.');
      return;
    }
    await fetchAttendance(draft.studentId);
  };

  const autoMapScores = () => {
    if (!draft) return;
    const source = sourceResults.find((item) => item.key === selectedSourceKey) ?? sourceResults[0];
    if (!source) {
      setNotice({ text: 'No result source is loaded.', tone: 'error' });
      return;
    }
    if (
      draft.subjects.some((subject) => subject.lastCum != null) &&
      !window.confirm('Auto-map will replace the Last Cum. values on matching rows. Continue?')
    ) {
      return;
    }
    setDraft((previous) => {
      if (!previous) return previous;
      return {
        ...previous,
        subjects: previous.subjects.map((subject) => {
          const match = bestSubjectMatch(subject, source.subjects, subjectAliasesRef.current);
          if (!match) return subject;
          const lastCum = mappedScore(match, 'lastCum');
          return recalcSubject(
            {
              ...subject,
              sourceSubjectId: match.id ?? null,
              sourceSubjectName: match.name,
            },
            { lastCum },
          );
        }),
      };
    });
    markDirty();
    setNotice({ text: `Mapped ${source.examName} scores into matching Last Cum. rows.`, tone: 'ok' });
  };

  const saveDraft = async (silent = false): Promise<boolean> => {
    if (!draft?.studentId) {
      if (!silent) setNotice({ text: 'Select or attach a pupil before saving.', tone: 'error' });
      return false;
    }
    // Never persist an empty card: at least one score, remark or comment must
    // have been entered. Autosave silently skips; a manual save explains why.
    if (!hasReportContent(draft)) {
      if (!silent) {
        setNotice({
          text: 'Fill at least one score, remark or comment before saving this result card.',
          tone: 'error',
        });
      }
      return false;
    }
    const revision = editRevisionRef.current;
    setSaving(true);
    try {
      const response = await apiPost<GeneratedReportCard>('/report-cards', draftPayload(draft));
      // A newer edit may have landed while the request was in flight. Keep it
      // local and let autosave send the next revision instead of overwriting it.
      if (editRevisionRef.current === revision) {
        const next = cardToDraft(response.data);
        setDraft(next);
        setVariant(next.variant);
        setDirty(false);
      }
      lastAutosaveErrorRef.current = null;
      if (!silent) {
        setNotice({ text: `Saved report card for ${response.data.studentName}.`, tone: 'ok' });
      }
      return true;
    } catch (error: any) {
      const message = error?.message ?? 'Could not save the report card.';
      lastAutosaveErrorRef.current = message;
      setNotice({ text: message, tone: 'error' });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveDraftRef = useRef<((silent?: boolean) => Promise<boolean>) | null>(null);
  saveDraftRef.current = saveDraft;

  // Autosave drafts after a short idle. This protects manually typed values
  // if the user switches term/pupil or closes the tab.
  useEffect(() => {
    if (!draft?.studentId || !dirty || selectionBusy || saving) return;
    if (lastAutosaveErrorRef.current) return;
    // Blank rows / untouched boxes are not a saveable report card.
    if (!hasReportContent(draft)) return;
    const timer = window.setTimeout(() => {
      void saveDraftRef.current?.(true);
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [draft, dirty, selectionBusy, saving]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const saveBeforeLeaving = async () => {
    if (!dirty) return true;
    if (!draft?.studentId) {
      setNotice({ text: 'Attach this card to a pupil before switching, or clear it first.', tone: 'error' });
      return false;
    }
    // Nothing meaningful has been typed yet — allow switching without writing
    // a blank card to the database.
    if (!hasReportContent(draft)) return true;
    return saveDraft(true);
  };

  const selectStudent = async (student: StudentRow) => {
    if (!(await saveBeforeLeaving())) return;
    await loadStudent(student, { successMessage: true });
  };

  const selectImportRow = async (row: ImportedStudentRow) => {
    if (!(await saveBeforeLeaving())) return;
    await loadImportedRow(row);
  };

  const resetCurrent = async () => {
    if (effectiveStudent) {
      await loadStudent(effectiveStudent, { successMessage: true });
      return;
    }
    if (importedRow) {
      await loadImportedRow(importedRow);
    }
  };

  const startBlankCard = async () => {
    if (!(await saveBeforeLeaving())) return;
    if (!session || !term) {
      setNotice({ text: 'The current session and term are not set in Settings yet.', tone: 'error' });
      return;
    }
    setMode('live');
    setSelectedStudent(null);
    setImportedRow(null);
    setSelectedImportKey('');
    setSourceResults([]);
    setSelectedSourceKey('');
    setAttendance(null);
    setAttendanceError(null);
    setLoadedDraft(blankDraft('', variant, session, term, null));
    setNotice({
      text: 'Blank result card created. Click any box on the sheet to type directly, then attach a pupil to save it.',
      tone: 'ok',
    });
  };

  const clearStudentResult = () => {
    if (!draft) return;
    if (
      !window.confirm(
        'Clear all scores, attendance and comments on this result card? The pupil stays selected.',
      )
    ) {
      return;
    }
    setDraft({
      ...draft,
      subjects: draft.subjects.map((subject) =>
        recalcSubject(
          {
            ...subject,
            cbt1: null,
            cbt2: null,
            exam: null,
            lastCum: null,
            overall: null,
          },
          {},
        ),
      ),
      present: undefined,
      absent: undefined,
      totalSchoolDays: undefined,
      classTeacherRemark: '',
      principalComment: '',
      newsLetter: '',
      nextTermBegins: '',
      affectivePuntuality: '',
      affectiveRespect: '',
      psychomotorHandwriting: '',
      psychomotorRecreation: '',
    });
    setAttendance(null);
    markDirty();
    setNotice({ text: 'Scores, attendance and comments cleared. Save to keep the cleared card.', tone: 'ok' });
  };

  const exportCards = async (all: boolean) => {
    if (!all && !draft?.studentId) {
      setNotice({ text: 'Select a pupil first, or use Export all.', tone: 'error' });
      return;
    }
    setExporting(true);
    try {
      if (!all) {
        if (dirty) {
          const saved = await saveDraft();
          if (!saved) return;
        }
        const { filename } = await apiDownload('/report-cards/export', {
          studentId: draft?.studentId,
          session,
          term,
        });
        setNotice({ text: `Exported the report card to ${filename}.`, tone: 'ok' });
      } else {
        const { filename } = await apiDownload('/report-cards/export', {
          session,
          term,
          classId: classFilter || undefined,
          variant,
        });
        setNotice({ text: `Exported saved report cards to ${filename}.`, tone: 'ok' });
      }
    } catch (error: any) {
      setNotice({ text: error?.message ?? 'Export failed', tone: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const downloadReportImage = async () => {
    const node = reportSheetRef.current;
    if (!node) {
      setNotice({ text: 'The result card is not ready yet.', tone: 'error' });
      return;
    }
    setDownloadingImage(true);
    setNotice(null);
    try {
      // Commit any open inline editor before capturing so the PNG shows the
      // printed value, not the editing input.
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      await new Promise((resolve) => window.setTimeout(resolve, 150));
      const name =
        draft?.studentName ||
        effectiveStudent?.user_name ||
        `${VARIANT_LABELS[variant]}-result-card`;
      await downloadNodeAsPng(node, {
        fileName: `report-card-${name}-${draft?.term ?? term}-${draft?.session ?? session}`,
        pixelRatio: 2.5,
      });
      setNotice({ text: 'Downloaded the result card as a PNG image.', tone: 'ok' });
    } catch (error: any) {
      setNotice({
        text: error?.message ?? 'Could not download the result card image.',
        tone: 'error',
      });
    } finally {
      setDownloadingImage(false);
    }
  };

  const onImported = (detail: ReportCardImportDetail) => {
    setImportOpen(false);
    setMode('import');
    setSelectedImportId(detail.id);
    setSelectedImportKey('');
    setImportedRow(null);
    void queryClient.invalidateQueries({ queryKey: ['report-card-imports'] });
    void queryClient.invalidateQueries({ queryKey: ['report-card-import', detail.id] });
    setNotice({
      text: `Imported ${detail.fileName}: ${detail.studentCount} pupil row(s). Select a row in the left panel.`,
      tone: 'ok',
    });
  };

  const previewSubjects: ReportSubject[] = draft ? draftToReportSubjects(draft) : draftToReportSubjects(previewDraft);
  const sourceForPanel = sourceResults.find((item) => item.key === selectedSourceKey) ?? sourceResults[0] ?? null;

  const topActionButtons = (
    <>
      <button
        type="button"
        onClick={() => void startBlankCard()}
        className="inline-flex min-h-11 items-center justify-center rounded border border-line bg-white px-4 py-2.5 text-sm font-bold hover:border-brand-500 hover:text-brand-700"
      >
        <FilePlus2 aria-hidden="true" size={15} className="mr-2" /> Blank card
      </button>
      <button
        type="button"
        onClick={() => setImportOpen(true)}
        className="inline-flex min-h-11 items-center justify-center rounded border border-line bg-white px-4 py-2.5 text-sm font-bold hover:border-brand-500 hover:text-brand-700"
      >
        <Upload aria-hidden="true" size={15} className="mr-2" /> Import Excel
      </button>
      <button
        type="button"
        onClick={() => void exportCards(true)}
        disabled={exporting}
        className="inline-flex min-h-11 items-center justify-center rounded border border-line bg-white px-4 py-2.5 text-sm font-bold hover:border-brand-500 hover:text-brand-700 disabled:opacity-50"
      >
        <Download aria-hidden="true" size={15} className="mr-2" /> Export all
      </button>
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex min-h-11 items-center justify-center rounded border border-line bg-white px-4 py-2.5 text-sm font-bold hover:border-brand-500 hover:text-brand-700"
      >
        <Printer aria-hidden="true" size={15} className="mr-2" /> Print
      </button>
    </>
  );

  const bottomPanel = (
    <AdminResultGeneratorBottomPanel
      draft={draft}
      dirty={dirty}
      saving={saving}
      exporting={exporting}
      downloadingImage={downloadingImage}
      onSave={() => void saveDraft()}
      onPrint={() => window.print()}
      onExport={() => void exportCards(false)}
      onDownloadImage={() => void downloadReportImage()}
      onReset={() => void resetCurrent()}
      onClear={clearStudentResult}
    />
  );

  if (academicQuery.isPending) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Reports" title="Result Generator" text="Loading the current session and term from Settings." />
        <div className="border border-line bg-white p-5"><LoadingSkeleton rows={6} /></div>
      </div>
    );
  }

  if (academicQuery.isError || !academicQuery.data?.data) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Reports" title="Result Generator" text="The current session and term could not be loaded." />
        <ErrorState message="Could not load the academic period from Settings." onRetry={() => academicQuery.refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24 xl:pb-0">
      <div className="print:hidden">
        <div className="mb-3 xl:hidden">
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand-700">Reports</p>
          <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">Result Generator</h1>
          <p className="mt-1 text-xs leading-5 text-muted">
            Select a pupil, then tap any box on the sheet to edit it.
          </p>
        </div>
        <div className="hidden xl:block">
          <PageHeader
            eyebrow="Reports"
            title="Result Generator"
            text="Build a printable result-notification sheet from live results or an imported Excel workbook. Click any box on the sheet to edit it in the inspector."
            actions={topActionButtons}
          />
        </div>
      </div>

      {notice && (
        <p
          role="status"
          className={`hidden border-l-2 px-4 py-3 text-sm print:hidden xl:block ${
            notice.tone === 'error'
              ? 'border-rose-400 bg-rose-50 text-rose-800'
              : 'border-lime-accent bg-brand-50 text-brand-800'
          }`}
        >
          {notice.text}
        </p>
      )}

      {!isDesktop && (leftOpen || rightOpen) && (
        <button
          type="button"
          aria-label="Close side panels"
          onClick={() => {
            setLeftOpen(false);
            setRightOpen(false);
          }}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] xl:hidden print:hidden"
        />
      )}

      <div className="flex flex-col gap-3 xl:flex-row xl:items-start">
        <div
          className={
            leftOpen
              ? 'fixed inset-y-0 left-0 z-50 flex h-[100dvh] w-[min(90vw,360px)] max-w-full flex-col overflow-y-auto overscroll-contain bg-white shadow-2xl xl:static xl:z-auto xl:h-auto xl:w-auto xl:overflow-visible xl:bg-transparent xl:shadow-none print:hidden'
              : 'hidden xl:block'
          }
        >
          <AdminResultGeneratorLeftPanel
            open={leftOpen}
            onToggle={toggleLeftPanel}
            mode={mode}
          onModeChange={setMode}
          search={studentSearch}
          onSearchChange={setStudentSearch}
          onSearch={() => setStudentQuery(studentSearch.trim())}
          classFilter={classFilter}
          onClassFilterChange={(value) => {
            setClassFilter(value);
            setStudentQuery(studentSearch.trim());
          }}
          classes={classes}
          students={students}
          studentsLoading={studentsQuery.isPending || studentsQuery.isFetching}
          selectedStudentId={effectiveStudent?.id ?? ''}
          onSelectStudent={(student) => void selectStudent(student)}
          imports={imports}
          importsLoading={importsQuery.isPending || importsQuery.isFetching}
          selectedImportId={selectedImportId}
          onSelectImport={(id) => {
            setSelectedImportId(id);
            setSelectedImportKey('');
            setImportedRow(null);
          }}
          importRows={importRows}
          importRowsLoading={importDetailQuery.isPending || importDetailQuery.isFetching}
          selectedImportKey={selectedImportKey}
          onSelectImportRow={(row) => void selectImportRow(row)}
            onOpenImport={() => setImportOpen(true)}
          />
        </div>

        <main className="min-w-0 flex-1 space-y-3 pb-20 xl:pb-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border border-line bg-white px-3 py-2 print:hidden">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={toggleLeftPanel}
                aria-expanded={leftOpen}
                className="hidden min-h-9 items-center gap-1 rounded border border-line px-2.5 text-[11px] font-bold text-muted hover:border-brand-500 hover:text-ink xl:inline-flex"
                title={leftOpen ? 'Collapse pupils panel' : 'Open pupils panel'}
              >
                {leftOpen ? '◀' : '▶'} Pupils
              </button>
              <button
                type="button"
                onClick={toggleRightPanel}
                aria-expanded={rightOpen}
                className="hidden min-h-9 items-center gap-1 rounded border border-line px-2.5 text-[11px] font-bold text-muted hover:border-brand-500 hover:text-ink xl:inline-flex"
                title={rightOpen ? 'Collapse inspector' : 'Open inspector'}
              >
                {rightOpen ? '▶' : '◀'} Inspector
              </button>
              <span className="mx-1 hidden h-6 w-px bg-line sm:block" />
              <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-muted">
                Template
                <select
                  value={variant}
                  onChange={(event) => selectVariant(event.target.value as ReportVariant)}
                  aria-label="Report card template"
                  className="min-h-9 rounded border border-line bg-white px-2 text-[11px] font-bold normal-case tracking-normal text-ink outline-none focus:border-brand-500"
                >
                  {VARIANT_ORDER.map((item) => (
                    <option key={item} value={item}>
                      {VARIANT_LABELS[item]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="inline-flex min-h-9 items-center rounded border border-line bg-brand-50 px-2.5 text-xs font-bold text-brand-900"
                title="The current session and term come from Settings and cannot be changed here."
              >
                {session || '—'} · {term || '—'}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted">Locked in Settings</span>
              <span
                className={`inline-flex min-h-8 items-center rounded px-2 text-[10px] font-bold uppercase tracking-wide ${
                  dirty ? 'bg-amber-50 text-amber-800' : 'bg-emerald-50 text-emerald-800'
                }`}
              >
                {dirty ? 'Unsaved' : 'Saved'}
              </span>
            </div>
          </div>

          {effectiveStudent && (
            <div className="flex flex-wrap items-center justify-between gap-2 border border-line bg-brand-50/60 px-3 py-2 text-xs print:hidden">
              <p className="text-brand-900">
                <b>{effectiveStudent.user_name}</b>
                {effectiveStudent.student?.combination?.name
                  ? ` · ${effectiveStudent.student.combination.name}`
                  : ''}
                {draft?.studentId ? ` · sheet ${VARIANT_LABELS[variant]}` : ''}
              </p>
              <p className="text-brand-700">
                {sourceResults.length > 0
                  ? `${sourceResults.length} result source(s) available`
                  : 'No online/offline result found — scores can be typed manually.'}
              </p>
            </div>
          )}

          {!draft && (
            <div className="border border-dashed border-line bg-cream px-4 py-3 text-sm text-muted print:hidden">
              Previewing the <b>{VARIANT_LABELS[variant]}</b> template. Select a pupil on the left or import an Excel workbook to start filling it.
            </div>
          )}

          <div
            id="report-card-print"
            className={`overflow-x-auto border border-line bg-cream p-3 transition-opacity md:p-5 ${
              selectionBusy ? 'opacity-60' : ''
            }`}
          >
            <div ref={reportSheetRef} className="mx-auto w-[794px]">
              <ReportCard
                variant={variant}
                term={draft?.term ?? term}
                session={draft?.session ?? session}
                studentName={displayDraft.studentName}
                admissionNumber={displayDraft.admissionNumber}
                className={displayDraft.className}
                photoUrl={displayDraft.photoUrl}
                subjects={previewSubjects}
                present={displayDraft.present}
                absent={displayDraft.absent}
                totalSchoolDays={displayDraft.totalSchoolDays}
                affective={{
                  puntuality: displayDraft.affectivePuntuality,
                  respect: displayDraft.affectiveRespect,
                }}
                psychomotor={{
                  handwriting: displayDraft.psychomotorHandwriting,
                  recreation: displayDraft.psychomotorRecreation,
                }}
                classTeacherRemark={displayDraft.classTeacherRemark}
                principalComment={displayDraft.principalComment}
                newsLetter={displayDraft.newsLetter}
                nextTermBegins={displayDraft.nextTermBegins}
                grading={academicQuery.data?.data.grading}
                activeField={selectedField}
                onFieldClick={draft ? handleFieldClick : undefined}
                onFieldCommit={draft ? commitInlineField : undefined}
              />
            </div>
          </div>
          <p className="text-center text-[10px] font-semibold text-muted xl:hidden print:hidden">
            Swipe sideways to see the full result sheet.
          </p>
        </main>

        <div
          className={
            rightOpen
              ? 'fixed inset-y-0 right-0 z-50 flex h-[100dvh] w-[min(90vw,380px)] max-w-full flex-col overflow-y-auto overscroll-contain bg-white shadow-2xl xl:static xl:z-auto xl:h-auto xl:w-auto xl:overflow-visible xl:bg-transparent xl:shadow-none print:hidden'
              : 'hidden xl:block'
          }
        >
          <AdminResultGeneratorRightPanel
            open={rightOpen}
            onToggle={toggleRightPanel}
            draft={displayDraft}
            selectedField={selectedField}
            onSelectField={setSelectedField}
            onPatchDraft={patchDraft}
            onPatchSubject={patchSubject}
            sourceResults={sourceResults}
            selectedSourceKey={selectedSourceKey}
            onSourceChange={setSelectedSourceKey}
            onCalculateAttendance={() => void calculateAttendance()}
            attendanceBusy={attendanceBusy}
            attendanceError={attendanceError}
            attendance={attendance}
            onAutoMap={autoMapScores}
            profilePhotoUrl={effectiveStudent?.student?.photoUrl || effectiveStudent?.img || ''}
            attachOptions={attachOptions}
            onAttachStudent={(studentId) => void attachStudent(studentId)}
            attaching={attaching}
            subjectAliases={subjectAliases}
            onSaveSubjectAliases={saveSubjectAliases}
          />
        </div>
      </div>

      <div className="hidden xl:block print:hidden">{bottomPanel}</div>

      {/* Mobile action bar: panels and the full action list open as drawers. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white/95 px-2 pb-2 pt-2 shadow-[0_-4px_16px_rgba(31,61,43,0.08)] backdrop-blur xl:hidden print:hidden">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleLeftPanel}
            aria-expanded={leftOpen}
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-1 rounded border border-line bg-white px-1.5 text-[11px] font-bold text-brand-800 hover:border-brand-500 hover:bg-brand-50"
          >
            <UserRound size={14} aria-hidden="true" /> Pupils
          </button>
          <button
            type="button"
            onClick={toggleRightPanel}
            aria-expanded={rightOpen}
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-1 rounded border border-line bg-white px-1.5 text-[11px] font-bold text-brand-800 hover:border-brand-500 hover:bg-brand-50"
          >
            <SlidersHorizontal size={14} aria-hidden="true" /> Inspector
          </button>
          <button
            type="button"
            onClick={openActions}
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-1 rounded border border-line bg-white px-1.5 text-[11px] font-bold text-brand-800 hover:border-brand-500 hover:bg-brand-50"
          >
            <Menu size={14} aria-hidden="true" /> Actions
          </button>
          <button
            type="button"
            onClick={() => void saveDraft()}
            disabled={!draft?.studentId || saving}
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-1 rounded bg-brand-500 px-1.5 text-[11px] font-bold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            <Save size={14} aria-hidden="true" /> {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {!isDesktop && actionsOpen && (
        <div className="fixed inset-0 z-50 xl:hidden print:hidden">
          <button
            type="button"
            aria-label="Close result actions"
            onClick={() => setActionsOpen(false)}
            className="absolute inset-0 bg-black/40 backdrop-blur-[1px]"
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto overscroll-contain border-t border-line bg-white px-3 pb-3 pt-2 shadow-2xl">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="font-display text-base font-extrabold text-ink">Result actions</p>
                <p className="text-[11px] text-muted">
                  Save, print, export or start a blank card.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActionsOpen(false)}
                aria-label="Close result actions"
                className="rounded border border-line p-2 text-muted hover:border-brand-300 hover:text-ink"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
            <div className="mb-3 grid grid-cols-2 gap-2">{topActionButtons}</div>
            {bottomPanel}
          </div>
        </div>
      )}

      <ImportResultsModal open={importOpen} onClose={() => setImportOpen(false)} onImported={onImported} />

      {sourceForPanel && (
        <p className="text-[10px] text-muted print:hidden">
          Active source: {sourceForPanel.examName} · {sourceForPanel.subjects.length} subject row(s). Click a score box on the sheet to map one value.
        </p>
      )}
    </div>
  );
}
