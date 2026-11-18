import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Printer, Upload } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/DashboardUI';
import { apiDownload, apiGet, apiPost } from '@/lib/api';
import { TERM_OPTIONS, sessionOptions, type ClassItem, type StudentRow } from '@/data/dashboard';
import ReportCard, { type ReportSubject } from '@/components/ui/ReportCard';
import { AdminResultGeneratorLeftPanel } from './result-generator/AdminResultGeneratorLeftPanel';
import { AdminResultGeneratorRightPanel } from './result-generator/AdminResultGeneratorRightPanel';
import { AdminResultGeneratorBottomPanel } from './result-generator/AdminResultGeneratorBottomPanel';
import { ImportResultsModal } from './result-generator/ImportResultsModal';
import {
  applyPreviousTermScores,
  bestSubjectMatch,
  blankDraft,
  cardToDraft,
  currentSession,
  currentTerm,
  detectVariant,
  draftPayload,
  draftToReportSubjects,
  mappedScore,
  previousTermOf,
  presetSubjects,
  recalcSubject,
  termDateRange,
  VARIANT_LABELS,
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

const loadSources = async (studentId: string): Promise<SourceResult[]> => {
  const [online, offline] = await Promise.allSettled([
    apiGet<TestResultRow[]>('/results', { userId: studentId, limit: 50 }),
    apiGet<TestResultRow[]>('/offline-results', { userId: studentId, limit: 50 }),
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
  const requestRef = useRef(0);
  const editRevisionRef = useRef(0);
  const lastAutosaveErrorRef = useRef<string | null>(null);
  const [session, setSession] = useState(currentSession());
  const [term, setTerm] = useState(currentTerm());
  const [variant, setVariant] = useState<ReportVariant>('junior');
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
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
    const timer = window.setTimeout(() => setNotice(null), notice.tone === 'error' ? 7000 : 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

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

  const setLoadedDraft = (next: ReportCardDraft) => {
    setDraft(next);
    setVariant(next.variant);
    setDirty(false);
    setSelectedField(null);
  };

  const loadStudent = async (
    student: StudentRow,
    options: { session?: string; term?: string; successMessage?: boolean } = {},
  ) => {
    const requestId = ++requestRef.current;
    const nextSession = options.session ?? session;
    const nextTerm = options.term ?? term;
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
        loadSources(student.id).catch(() => []),
      ]);
      if (requestId !== requestRef.current) return;
      let nextDraft = cardResponse.data ? cardToDraft(cardResponse.data) : base;
      nextDraft = previousTerm
        ? applyPreviousTermScores(nextDraft, previousCard, Boolean(cardResponse.data))
        : applyPreviousTermScores(nextDraft, null, false);
      setLoadedDraft(nextDraft);
      setSourceResults(sources);
      setSelectedSourceKey(sources[0]?.key ?? '');
      if (options.successMessage) {
        setNotice({ text: `Loaded ${student.user_name}.`, tone: 'ok' });
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
    nextDraft = previousTerm
      ? applyPreviousTermScores(nextDraft, previousCard, hasSavedCard)
      : applyPreviousTermScores(nextDraft, null, false);

    if (requestId !== requestRef.current) return;
    setSelectedStudent(student);
    setLoadedDraft(nextDraft);
    const source: SourceResult = {
      key: `import:${row.key}`,
      origin: 'IMPORT',
      examName: row.examName || 'Imported results',
      overallScore: row.overallScore,
      subjects: row.subjects,
    };
    setSourceResults([source]);
    setSelectedSourceKey(source.key);
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

  const changePeriod = async (nextSession: string, nextTerm: string) => {
    if (nextSession === session && nextTerm === term) return;
    if (dirty) {
      if (!draft?.studentId) {
        setNotice({ text: 'Attach this imported row to a pupil before switching term.', tone: 'error' });
        return;
      }
      const saved = await saveDraft(true);
      if (!saved) return;
    }
    setSession(nextSession);
    setTerm(nextTerm);
    if (effectiveStudent) {
      await loadStudent(effectiveStudent, {
        session: nextSession,
        term: nextTerm,
        successMessage: true,
      });
    } else if (draft) {
      patchDraft({
        session: nextSession,
        term: nextTerm,
        attendanceFrom: termDateRange(nextTerm, nextSession).from,
        attendanceTo: termDateRange(nextTerm, nextSession).to,
      });
    }
  };

  const calculateAttendance = async (from: string, to: string) => {
    if (!draft?.studentId) {
      setAttendanceError('Attach this imported row to a pupil first.');
      return;
    }
    setAttendanceBusy(true);
    setAttendanceError(null);
    try {
      const response = await apiGet<AttendanceSummary>('/report-cards/attendance', {
        studentId: draft.studentId,
        from,
        to,
      });
      setAttendance(response.data);
      patchDraft({
        attendanceFrom: response.data.from,
        attendanceTo: response.data.to,
        totalSchoolDays: response.data.totalSchoolDays,
        present: response.data.present,
        absent: response.data.absent,
      });
    } catch (error: any) {
      setAttendanceError(error?.message ?? 'Could not calculate attendance');
    } finally {
      setAttendanceBusy(false);
    }
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
          const match = bestSubjectMatch(subject, source.subjects);
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
      setNotice({ text: 'Attach this imported row to a pupil before switching.', tone: 'error' });
      return false;
    }
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

  return (
    <div className="space-y-5">
      <div className="print:hidden">
        <PageHeader
          eyebrow="Reports"
          title="Result Generator"
          text="Build a printable result-notification sheet from live results or an imported Excel workbook. Click any box on the sheet to edit it in the inspector."
          actions={
            <>
              <button
                type="button"
                onClick={() => setImportOpen(true)}
                className="inline-flex min-h-11 items-center rounded border border-line bg-white px-4 py-2.5 text-sm font-bold hover:border-brand-500 hover:text-brand-700"
              >
                <Upload aria-hidden="true" size={15} className="mr-2" /> Import Excel
              </button>
              <button
                type="button"
                onClick={() => void exportCards(true)}
                disabled={exporting}
                className="inline-flex min-h-11 items-center rounded border border-line bg-white px-4 py-2.5 text-sm font-bold hover:border-brand-500 hover:text-brand-700 disabled:opacity-50"
              >
                <Download aria-hidden="true" size={15} className="mr-2" /> Export all
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex min-h-11 items-center rounded border border-line bg-white px-4 py-2.5 text-sm font-bold hover:border-brand-500 hover:text-brand-700"
              >
                <Printer aria-hidden="true" size={15} className="mr-2" /> Print
              </button>
            </>
          }
        />
      </div>

      {notice && (
        <p
          role="status"
          className={`border-l-2 px-4 py-3 text-sm print:hidden ${
            notice.tone === 'error'
              ? 'border-rose-400 bg-rose-50 text-rose-800'
              : 'border-lime-accent bg-brand-50 text-brand-800'
          }`}
        >
          {notice.text}
        </p>
      )}

      <div className="flex flex-col gap-3 xl:flex-row xl:items-start">
        <AdminResultGeneratorLeftPanel
          open={leftOpen}
          onToggle={() => setLeftOpen((value) => !value)}
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

        <main className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border border-line bg-white px-3 py-2 print:hidden">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setLeftOpen((value) => !value)}
                className="inline-flex min-h-9 items-center gap-1 rounded border border-line px-2.5 text-[11px] font-bold text-muted hover:border-brand-500 hover:text-ink"
                title={leftOpen ? 'Collapse pupils panel' : 'Open pupils panel'}
              >
                {leftOpen ? '◀' : '▶'} Pupils
              </button>
              <button
                type="button"
                onClick={() => setRightOpen((value) => !value)}
                className="inline-flex min-h-9 items-center gap-1 rounded border border-line px-2.5 text-[11px] font-bold text-muted hover:border-brand-500 hover:text-ink"
                title={rightOpen ? 'Collapse inspector' : 'Open inspector'}
              >
                {rightOpen ? '▶' : '◀'} Inspector
              </button>
              <span className="mx-1 hidden h-6 w-px bg-line sm:block" />
              <div className="flex flex-wrap gap-1" role="group" aria-label="Report card variant">
                {VARIANT_ORDER.map((item) => {
                  const active = item === variant;
                  return (
                    <button
                      key={item}
                      type="button"
                      onClick={() => selectVariant(item)}
                      aria-pressed={active}
                      className={`min-h-9 rounded border px-2.5 text-[11px] font-bold transition-colors ${
                        active
                          ? 'border-brand-500 bg-brand-50 text-brand-900'
                          : 'border-line bg-white text-muted hover:border-brand-300 hover:text-ink'
                      }`}
                    >
                      {VARIANT_LABELS[item]}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-[10px] font-bold uppercase tracking-wide text-muted">
                Session
                <select
                  value={session}
                  onChange={(event) => void changePeriod(event.target.value, term)}
                  className="ml-1 min-h-9 rounded border border-line bg-white px-2 text-xs font-semibold"
                >
                  {sessionOptions().map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-[10px] font-bold uppercase tracking-wide text-muted">
                Term
                <select
                  value={term}
                  onChange={(event) => void changePeriod(session, event.target.value)}
                  className="ml-1 min-h-9 rounded border border-line bg-white px-2 text-xs font-semibold"
                >
                  {TERM_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
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
              activeField={selectedField}
              onFieldClick={draft ? handleFieldClick : undefined}
            />
          </div>
        </main>

        <AdminResultGeneratorRightPanel
          open={rightOpen}
          onToggle={() => setRightOpen((value) => !value)}
          draft={displayDraft}
          selectedField={selectedField}
          onSelectField={setSelectedField}
          onPatchDraft={patchDraft}
          onPatchSubject={patchSubject}
          sourceResults={sourceResults}
          selectedSourceKey={selectedSourceKey}
          onSourceChange={setSelectedSourceKey}
          onCalculateAttendance={(from, to) => void calculateAttendance(from, to)}
          attendanceBusy={attendanceBusy}
          attendanceError={attendanceError}
          attendance={attendance}
          onUseTermDates={() => {
            const range = termDateRange(draft?.term ?? term, draft?.session ?? session);
            patchDraft({ attendanceFrom: range.from, attendanceTo: range.to });
          }}
          onAutoMap={autoMapScores}
          profilePhotoUrl={effectiveStudent?.student?.photoUrl || effectiveStudent?.img || ''}
          attachOptions={attachOptions}
          onAttachStudent={(studentId) => void attachStudent(studentId)}
          attaching={attaching}
        />
      </div>

      <AdminResultGeneratorBottomPanel
        draft={draft}
        dirty={dirty}
        saving={saving}
        exporting={exporting}
        onSave={() => void saveDraft()}
        onPrint={() => window.print()}
        onExport={() => void exportCards(false)}
        onReset={() => void resetCurrent()}
      />

      <ImportResultsModal open={importOpen} onClose={() => setImportOpen(false)} onImported={onImported} />

      {sourceForPanel && (
        <p className="text-[10px] text-muted print:hidden">
          Active source: {sourceForPanel.examName} · {sourceForPanel.subjects.length} subject row(s). Click a score box on the sheet to map one value.
        </p>
      )}
    </div>
  );
}
