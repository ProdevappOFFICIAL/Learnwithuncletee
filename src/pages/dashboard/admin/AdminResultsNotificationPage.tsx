import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Eye, EyeOff, Plus, Trash2, UserCheck } from 'lucide-react';
import {
  Card,
  CardHead,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
  Pill,
} from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api';
import { ACADEMIC_TERMS, useAcademicSettings } from '@/lib/academic';
import {
  sessionOptions,
  type ClassItem,
  type ExamItem,
  type StaffRow,
  type SubjectItem,
} from '@/data/dashboard';

interface ScoreAssignmentItem {
  id: string;
  teacherId: string;
  teacher: { id: string; user_name: string; user_email: string };
  classId: string;
  class: { id: string; name: string };
  subjectId: string;
  subject: { id: string; name: string; code?: string | null };
  examId: string;
  exam: { id: string; exam_name: string; minutes?: number };
  component: 'CBT1' | 'CBT2' | 'EXAM';
  createdAt: string;
}

interface AssignmentGroup {
  key: string;
  teacher: ScoreAssignmentItem['teacher'];
  class: ScoreAssignmentItem['class'];
  exam: ScoreAssignmentItem['exam'];
  rows: ScoreAssignmentItem[];
}

interface ClassSetup {
  classId: string;
  className: string;
  subjects: SubjectItem[];
  exam: ExamItem | null;
}

interface ResultNotificationSetting {
  session: string;
  term: string;
  disabled: boolean;
  available: boolean;
  status: 'AVAILABLE' | 'DISABLED' | 'NOT_STARTED' | 'CLOSED';
  message: string;
  termStart: string;
  termEnd: string;
  visibleUntil: string;
}

const selectClass =
  'min-h-11 w-full rounded border border-line bg-white px-3 text-sm font-semibold';

const isExaminationExam = (name: string) => /examination/i.test(name);

const subjectIdsFor = (setup: ClassSetup, selected: Record<string, string[]>) =>
  selected[setup.classId] ?? [];

export const AdminResultsNotificationPage = () => {
  const [teacherId, setTeacherId] = useState('');
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<Record<string, string[]>>({});
  const [filterClassId, setFilterClassId] = useState('');
  const [visibilitySession, setVisibilitySession] = useState('');
  const [visibilityTerm, setVisibilityTerm] = useState('');
  const [disabled, setDisabled] = useState(false);
  const [visibilityBusy, setVisibilityBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; tone: 'ok' | 'error' } | null>(null);
  const [busy, setBusy] = useState(false);

  const academic = useAcademicSettings();
  const effectiveVisibilitySession = visibilitySession || academic.data?.data.session || '';
  const effectiveVisibilityTerm = visibilityTerm || academic.data?.data.term || '';
  const sessionChoices = academic.data?.data.sessionOptions ?? sessionOptions();

  const teachersRes = useResource<StaffRow[]>('/staff', { limit: 200 });
  const classesRes = useResource<ClassItem[]>('/classes', { limit: 200 });
  const assignmentsRes = useResource<ScoreAssignmentItem[]>('/report-cards/score-assignments', {
    classId: filterClassId || undefined,
  });
  const visibilityRes = useResource<ResultNotificationSetting>('/settings/result-notification', {
    session: effectiveVisibilitySession || undefined,
    term: effectiveVisibilityTerm || undefined,
  });

  useEffect(() => {
    setDisabled(Boolean(visibilityRes.data?.disabled));
  }, [visibilityRes.data]);

  const visibilityStatus = visibilityRes.data?.status ?? 'AVAILABLE';
  const visibilityTone =
    visibilityStatus === 'AVAILABLE'
      ? 'emerald'
      : visibilityStatus === 'DISABLED'
        ? 'rose'
        : visibilityStatus === 'NOT_STARTED'
          ? 'amber'
          : 'ink';

  const saveVisibility = async () => {
    if (!effectiveVisibilitySession || !effectiveVisibilityTerm) {
      setNotice({ text: 'Choose a session and term first.', tone: 'error' });
      return;
    }
    setVisibilityBusy(true);
    setNotice(null);
    try {
      await apiPut<ResultNotificationSetting>('/settings/result-notification', {
        session: effectiveVisibilitySession,
        term: effectiveVisibilityTerm,
        disabled,
      });
      visibilityRes.reload();
      setNotice({
        text: disabled
          ? `Result notification disabled for ${effectiveVisibilitySession} · ${effectiveVisibilityTerm}. Pupils will see “Result is being worked on”.`
          : `Result notification enabled for ${effectiveVisibilitySession} · ${effectiveVisibilityTerm}. It closes automatically at the end of the term.`,
        tone: 'ok',
      });
    } catch (error: any) {
      setNotice({ text: error?.message ?? 'Could not save the visibility setting.', tone: 'error' });
    } finally {
      setVisibilityBusy(false);
    }
  };

  const teachers = useMemo(
    () => (teachersRes.data ?? []).filter((row) => row.role === 'TEACHER'),
    [teachersRes.data],
  );
  const classes = classesRes.data ?? [];
  const assignments = assignmentsRes.data ?? [];

  const classSetupQuery = useQuery({
    queryKey: ['results-notification-class-setup', selectedClassIds],
    queryFn: async () => {
      const rows = await Promise.all(
        selectedClassIds.map(async (classId) => {
          const [subjects, exams] = await Promise.all([
            apiGet<SubjectItem[]>('/subjects', { classId, limit: 300 }),
            apiGet<ExamItem[]>('/exams', { classId, limit: 300 }),
          ]);
          return {
            classId,
            className: classes.find((item) => item.id === classId)?.name ?? 'Class',
            subjects: subjects.data ?? [],
            exam: (exams.data ?? []).find((exam) => isExaminationExam(exam.exam_name)) ?? null,
          } satisfies ClassSetup;
        }),
      );
      return rows;
    },
    enabled: selectedClassIds.length > 0,
    staleTime: 30_000,
  });

  const classSetups = classSetupQuery.data ?? [];

  const examinationAssignments = useMemo(
    () => assignments.filter((row) => row.component === 'EXAM'),
    [assignments],
  );

  const groups = useMemo<AssignmentGroup[]>(() => {
    const map = new Map<string, AssignmentGroup>();
    for (const row of examinationAssignments) {
      const key = `${row.teacherId}:${row.classId}:${row.examId}`;
      const existing =
        map.get(key) ??
        {
          key,
          teacher: row.teacher,
          class: row.class,
          exam: row.exam,
          rows: [],
        };
      existing.rows.push(row);
      map.set(key, existing);
    }
    return [...map.values()].sort(
      (a, b) =>
        a.class.name.localeCompare(b.class.name) ||
        a.teacher.user_name.localeCompare(b.teacher.user_name),
    );
  }, [examinationAssignments]);

  const selectedSubjectCount = classSetups.reduce(
    (sum, setup) => sum + subjectIdsFor(setup, selectedSubjects).length,
    0,
  );
  const allClassesSelected = classes.length > 0 && selectedClassIds.length === classes.length;

  const toggleClass = (classId: string) => {
    setSelectedClassIds((previous) =>
      previous.includes(classId)
        ? previous.filter((id) => id !== classId)
        : [...previous, classId],
    );
    setSelectedSubjects((previous) => {
      const next = { ...previous };
      if (next[classId]) delete next[classId];
      return next;
    });
  };

  const toggleAllClasses = () => {
    if (allClassesSelected) {
      setSelectedClassIds([]);
      setSelectedSubjects({});
    } else {
      setSelectedClassIds(classes.map((cls) => cls.id));
      setSelectedSubjects({});
    }
  };

  const toggleSubject = (setup: ClassSetup, subjectId: string) => {
    if (!setup.exam) return;
    setSelectedSubjects((previous) => {
      const current = previous[setup.classId] ?? [];
      return {
        ...previous,
        [setup.classId]: current.includes(subjectId)
          ? current.filter((id) => id !== subjectId)
          : [...current, subjectId],
      };
    });
  };

  const toggleAllSubjects = (setup: ClassSetup) => {
    if (!setup.exam) return;
    const current = subjectIdsFor(setup, selectedSubjects);
    const all = setup.subjects.length > 0 && setup.subjects.every((subject) => current.includes(subject.id));
    setSelectedSubjects((previous) => ({
      ...previous,
      [setup.classId]: all ? [] : setup.subjects.map((subject) => subject.id),
    }));
  };

  const addAssignments = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotice(null);
    if (!teacherId) {
      setNotice({ text: 'Choose a teacher first.', tone: 'error' });
      return;
    }
    const classGroups = classSetups
      .map((setup) => ({
        classId: setup.classId,
        subjectIds: subjectIdsFor(setup, selectedSubjects),
      }))
      .filter((group) => group.subjectIds.length > 0);

    if (!classGroups.length) {
      setNotice({ text: 'Tick at least one subject under a class.', tone: 'error' });
      return;
    }
    const missingExam = classSetups.find(
      (setup) => subjectIdsFor(setup, selectedSubjects).length > 0 && !setup.exam,
    );
    if (missingExam) {
      setNotice({
        text: `${missingExam.className} has no Examination exam. Create one with “Examination” in the name first.`,
        tone: 'error',
      });
      return;
    }

    setBusy(true);
    try {
      const response = await apiPost<{
        created: number;
        skipped: number;
        classes: Array<{
          className: string;
          exam: { exam_name: string };
          created: number;
          skipped: number;
        }>;
        assignments: ScoreAssignmentItem[];
      }>('/report-cards/score-assignments', {
        teacherId,
        classes: classGroups,
      });
      assignmentsRes.reload();
      setNotice({
        text: `${response.data.created} subject assignment(s) added across ${
          response.data.classes.length
        } class(es)${
          response.data.skipped ? ` · ${response.data.skipped} already present` : ''
        }.`,
        tone: 'ok',
      });
      setSelectedSubjects({});
    } catch (error: any) {
      setNotice({ text: error?.message ?? 'Could not save the assignments.', tone: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const removeAssignment = async (row: ScoreAssignmentItem) => {
    if (
      !window.confirm(
        `Remove ${row.teacher.user_name}'s access to ${row.subject.name} on ${row.exam.exam_name}?`,
      )
    ) {
      return;
    }
    try {
      await apiDelete(`/report-cards/score-assignments/${row.id}`);
      assignmentsRes.reload();
      setNotice({ text: 'Subject assignment removed.', tone: 'ok' });
    } catch (error: any) {
      setNotice({ text: error?.message ?? 'Could not remove the assignment.', tone: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Results"
        title="Results Notification"
        text="Assign a teacher to one or more classes, then tick the subjects they can enter Examination scores for. Each class uses its own Examination exam; CBT 1, CBT 2 and calculated columns stay read-only for teachers."
      />

      {notice && (
        <p
          role="status"
          className={`border-l-2 px-4 py-3 text-sm ${
            notice.tone === 'error'
              ? 'border-rose-400 bg-rose-50 text-rose-800'
              : 'border-lime-accent bg-brand-50 text-brand-800'
          }`}
        >
          {notice.text}
        </p>
      )}

      <Card>
        <CardHead
          title="Student visibility"
          sub="Turn the result notification on or off for a session and term. It also closes automatically at the end of that term."
        />
        <div className="space-y-4 px-5 py-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block text-sm font-semibold">
              Session
              <select
                value={effectiveVisibilitySession}
                onChange={(event) => {
                  setVisibilitySession(event.target.value);
                  setDisabled(false);
                }}
                className={`${selectClass} mt-2`}
              >
                {!sessionChoices.length && <option value="">Loading sessions…</option>}
                {sessionChoices.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-semibold">
              Term
              <select
                value={effectiveVisibilityTerm}
                onChange={(event) => {
                  setVisibilityTerm(event.target.value);
                  setDisabled(false);
                }}
                className={`${selectClass} mt-2`}
              >
                {ACADEMIC_TERMS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <Pill tone={visibilityTone}>{visibilityStatus.replace('_', ' ')}</Pill>
            </div>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-3 rounded border border-line bg-cream px-3 py-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded bg-white text-brand-700">
                {disabled ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
              </span>
              <div>
                <p className="text-sm font-bold text-ink">
                  {disabled
                    ? 'Disabled — pupils see “Result is being worked on”'
                    : 'Enabled — pupils can view the published sheet'}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {visibilityRes.loading
                    ? 'Loading the visibility window…'
                    : visibilityRes.data
                      ? `Pupils can view from ${visibilityRes.data.termStart} until ${visibilityRes.data.termEnd}. After that the page closes automatically.`
                      : 'The visibility window follows the term dates in Settings.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={disabled}
              aria-label="Disable result notification for this session and term"
              onClick={() => setDisabled((value) => !value)}
              className={`inline-flex h-7 w-12 shrink-0 items-center rounded-full px-1 transition-colors ${
                disabled ? 'bg-rose-500' : 'bg-brand-500'
              }`}
            >
              <span
                className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  disabled ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted">
              Disabling only affects pupils. Staff can still preview and edit the sheet. For other
              sessions the standard school calendar supplies the term end date.
            </p>
            <button
              type="button"
              onClick={() => void saveVisibility()}
              disabled={visibilityBusy || !effectiveVisibilitySession || !effectiveVisibilityTerm}
              className="inline-flex min-h-11 items-center rounded bg-brand-900 px-5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {visibilityBusy ? 'Saving…' : 'Save visibility'}
            </button>
          </div>
        </div>
      </Card>

      <Card>
        <CardHead
          title="Assign classes and subjects"
          sub="Tick every class, then choose the subjects for each class. The Examination exam is filled automatically."
        />
        <form onSubmit={addAssignments} className="space-y-4 px-5 py-5">
          <label className="block max-w-xl text-sm font-semibold">
            Teacher
            <select
              value={teacherId}
              onChange={(event) => setTeacherId(event.target.value)}
              className={`${selectClass} mt-2`}
            >
              <option value="">— Select teacher —</option>
              {teachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.user_name} · {teacher.user_email}
                </option>
              ))}
            </select>
          </label>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold">
                Classes{' '}
                {classes.length > 0 && (
                  <span className="font-normal text-muted">({selectedClassIds.length} selected)</span>
                )}
              </p>
              <button
                type="button"
                onClick={toggleAllClasses}
                disabled={!classes.length}
                className="text-xs font-bold text-brand-700 underline underline-offset-4 hover:text-brand-500 disabled:opacity-40"
              >
                {allClassesSelected ? 'Clear all classes' : 'Select all classes'}
              </button>
            </div>
            {classesRes.loading ? (
              <div className="mt-2"><LoadingSkeleton rows={2} /></div>
            ) : classes.length === 0 ? (
              <p className="mt-2 rounded border border-dashed border-line bg-cream px-3 py-4 text-xs text-muted">
                No classes found.
              </p>
            ) : (
              <div className="mt-2 grid max-h-48 gap-1.5 overflow-y-auto rounded border border-line bg-white p-2 sm:grid-cols-2 lg:grid-cols-3">
                {classes.map((cls) => (
                  <label
                    key={cls.id}
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-xs font-semibold hover:bg-cream"
                  >
                    <input
                      type="checkbox"
                      checked={selectedClassIds.includes(cls.id)}
                      onChange={() => toggleClass(cls.id)}
                      className="h-4 w-4 accent-brand-500"
                    />
                    <span className="min-w-0 truncate">{cls.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {selectedClassIds.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold">Subjects by class</p>
                <p className="text-xs text-muted">
                  {selectedSubjectCount} subject(s) selected across {selectedClassIds.length} class(es)
                </p>
              </div>
              {classSetupQuery.isPending ? (
                <LoadingSkeleton rows={3} />
              ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                  {classSetups.map((setup) => {
                    const current = subjectIdsFor(setup, selectedSubjects);
                    const allSelected =
                      setup.subjects.length > 0 &&
                      setup.subjects.every((subject) => current.includes(subject.id));
                    return (
                      <div key={setup.classId} className="rounded border border-line bg-white p-3">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-extrabold text-ink">{setup.className}</p>
                            <p className="text-[11px] text-muted">
                              {setup.exam ? setup.exam.exam_name : 'No Examination exam for this class'}
                            </p>
                          </div>
                          {setup.exam ? (
                            <Pill tone="violet">Examination</Pill>
                          ) : (
                            <Pill tone="rose">Missing exam</Pill>
                          )}
                        </div>
                        {!setup.exam ? (
                          <p className="mt-3 rounded border border-rose-200 bg-rose-50 px-2.5 py-2 text-[11px] text-rose-800">
                            Create an exam with “Examination” in the name before assigning subjects here.
                          </p>
                        ) : (
                          <>
                            <div className="mt-2 flex justify-end">
                              <button
                                type="button"
                                onClick={() => toggleAllSubjects(setup)}
                                disabled={!setup.subjects.length}
                                className="text-[11px] font-bold text-brand-700 underline underline-offset-4 hover:text-brand-500 disabled:opacity-40"
                              >
                                {allSelected ? 'Clear subjects' : 'Select all subjects'}
                              </button>
                            </div>
                            {setup.subjects.length === 0 ? (
                              <p className="mt-1 text-[11px] text-muted">This class has no subjects.</p>
                            ) : (
                              <div className="mt-1 grid max-h-40 gap-1 overflow-y-auto pr-1 sm:grid-cols-2">
                                {setup.subjects.map((subject) => (
                                  <label
                                    key={subject.id}
                                    className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-[11px] font-semibold hover:bg-cream"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={current.includes(subject.id)}
                                      onChange={() => toggleSubject(setup, subject.id)}
                                      className="h-4 w-4 accent-brand-500"
                                    />
                                    <span className="min-w-0 truncate">{subject.name}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
            <p className="text-xs text-muted">
              The score column is locked to each class’s Examination exam. CBT 1 and CBT 2 are never
              assignable here.
            </p>
            <button
              type="submit"
              disabled={busy || !teacherId || selectedSubjectCount === 0 || classSetupQuery.isPending}
              className="inline-flex min-h-11 items-center gap-2 rounded bg-brand-500 px-5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              <Plus size={15} aria-hidden="true" /> {busy ? 'Saving…' : 'Assign selected subjects'}
            </button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHead
          title="Teacher Examination assignments"
          sub={`${examinationAssignments.length} subject assignment(s) · class-teacher remarks and principal comments stay controlled by Statuses`}
          link={{ to: '/dashboard/admin/teachers/statuses', label: 'Manage statuses' }}
        />
        <div className="flex flex-wrap items-end gap-3 border-b border-line px-5 py-4">
          <label className="block text-sm font-semibold">
            Filter class
            <select
              value={filterClassId}
              onChange={(event) => setFilterClassId(event.target.value)}
              className={`${selectClass} mt-2 min-w-[180px]`}
            >
              <option value="">All classes</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => assignmentsRes.reload()}
            className="min-h-11 rounded border border-line px-4 text-sm font-bold hover:border-brand-500 hover:text-brand-700"
          >
            Refresh
          </button>
        </div>

        {assignmentsRes.loading ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={4} /></div>
        ) : assignmentsRes.error ? (
          <div className="px-5 py-5">
            <ErrorState message={assignmentsRes.error} onRetry={assignmentsRes.reload} />
          </div>
        ) : groups.length === 0 ? (
          <div className="px-5 py-5">
            <EmptyState message="No Examination subject assignments yet. Add the first one above." />
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {groups.map((group) => (
              <li key={group.key} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-brand-50 text-brand-700">
                      <UserCheck size={17} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{group.teacher.user_name}</p>
                      <p className="text-xs text-muted">
                        {group.class.name} · {group.exam.exam_name}
                      </p>
                    </div>
                  </div>
                  <Pill tone="violet">Examination</Pill>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {group.rows.map((row) => (
                    <span
                      key={row.id}
                      className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-bold text-brand-800"
                    >
                      {row.subject.name}
                      <button
                        type="button"
                        onClick={() => void removeAssignment(row)}
                        aria-label={`Remove ${row.subject.name} from ${group.teacher.user_name}`}
                        className="text-brand-700 hover:text-rose-700"
                      >
                        <Trash2 size={11} aria-hidden="true" />
                      </button>
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};
