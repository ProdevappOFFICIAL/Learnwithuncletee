import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, BookOpen, Plus, Trash2, X } from 'lucide-react';
import { apiDelete, apiGet, apiPost } from '@/lib/api';
import type { ClassItem, ExamItem, SubjectItem } from '@/data/dashboard';

export interface TeacherAssignmentRow {
  id: string;
  classId: string;
  subjectId: string;
  examId: string;
  component: 'CBT1' | 'CBT2' | 'EXAM';
  class: { id: string; name: string };
  subject: { id: string; name: string; code?: string | null };
  exam: { id: string; exam_name: string; minutes?: number };
}

interface ClassSetup {
  classId: string;
  className: string;
  subjects: SubjectItem[];
  exam: ExamItem | null;
}

const isExaminationExam = (name: string) => /examination/i.test(name);

const classOrder = (a: ClassItem, b: ClassItem) =>
  a.name.localeCompare(b.name, undefined, { numeric: true });

const selectClass =
  'min-h-11 w-full rounded border border-line bg-white px-3 text-sm font-semibold';

export const TeacherAssignmentDialog = ({
  open,
  onClose,
  teacher,
  assignments,
  classes,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  teacher: { id: string; user_name: string; user_email: string } | null;
  assignments: TeacherAssignmentRow[];
  classes: ClassItem[];
  onSaved: (message: string) => void;
}) => {
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [classIds, setClassIds] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const next: Record<string, string[]> = {};
    for (const row of assignments) {
      if (row.component !== 'EXAM') continue;
      const list = next[row.classId] ?? [];
      if (!list.includes(row.subjectId)) list.push(row.subjectId);
      next[row.classId] = list;
    }
    setSelected(next);
    setClassIds(
      Object.keys(next).sort((a, b) => {
        const left = classes.find((cls) => cls.id === a)?.name ?? '';
        const right = classes.find((cls) => cls.id === b)?.name ?? '';
        return left.localeCompare(right, undefined, { numeric: true });
      }),
    );
    setError(null);
    setBusy(false);
  }, [open, teacher?.id, assignments, classes]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

  const setupQuery = useQuery({
    queryKey: ['teacher-assignment-dialog', teacher?.id, [...classIds].sort().join(',')],
    queryFn: async () => {
      const rows = await Promise.all(
        classIds.map(async (classId) => {
          const [subjects, exams] = await Promise.all([
            apiGet<SubjectItem[]>('/subjects', { classId, limit: 300 }),
            apiGet<ExamItem[]>('/exams', { classId, limit: 300 }),
          ]);
          return {
            classId,
            className: classes.find((cls) => cls.id === classId)?.name ?? 'Class',
            subjects: subjects.data ?? [],
            exam: (exams.data ?? []).find((exam) => isExaminationExam(exam.exam_name)) ?? null,
          } satisfies ClassSetup;
        }),
      );
      return rows;
    },
    enabled: open && classIds.length > 0,
    staleTime: 30_000,
  });

  const setups = setupQuery.data ?? [];
  const availableClasses = useMemo(
    () => classes.filter((cls) => !classIds.includes(cls.id)).sort(classOrder),
    [classes, classIds],
  );
  const selectedCount = classIds.reduce((sum, classId) => sum + (selected[classId]?.length ?? 0), 0);

  const addClass = (classId: string) => {
    if (!classId || classIds.includes(classId)) return;
    setClassIds((previous) =>
      [...previous, classId].sort((a, b) => {
        const left = classes.find((cls) => cls.id === a)?.name ?? '';
        const right = classes.find((cls) => cls.id === b)?.name ?? '';
        return left.localeCompare(right, undefined, { numeric: true });
      }),
    );
    setSelected((previous) => ({ ...previous, [classId]: previous[classId] ?? [] }));
  };

  const removeClass = (classId: string) => {
    setClassIds((previous) => previous.filter((id) => id !== classId));
    setSelected((previous) => {
      const next = { ...previous };
      delete next[classId];
      return next;
    });
  };

  const toggleSubject = (classId: string, subjectId: string) => {
    setSelected((previous) => {
      const current = previous[classId] ?? [];
      return {
        ...previous,
        [classId]: current.includes(subjectId)
          ? current.filter((id) => id !== subjectId)
          : [...current, subjectId],
      };
    });
  };

  const toggleAll = (setup: ClassSetup) => {
    const current = selected[setup.classId] ?? [];
    const all = setup.subjects.length > 0 && setup.subjects.every((subject) => current.includes(subject.id));
    setSelected((previous) => ({
      ...previous,
      [setup.classId]: all ? [] : setup.subjects.map((subject) => subject.id),
    }));
  };

  const save = async () => {
    if (busy || !teacher) return;
    setError(null);

    const setupByClass = new Map(setups.map((setup) => [setup.classId, setup]));
    const desired = new Map<string, { classId: string; subjectId: string }>();

    for (const classId of classIds) {
      const subjectIds = selected[classId] ?? [];
      if (!subjectIds.length) continue;
      const setup = setupByClass.get(classId);
      if (!setup) {
        setError('The selected classes are still loading. Try again in a moment.');
        return;
      }
      if (!setup.exam) {
        setError(`${setup.className} has no Examination exam. Create one first.`);
        return;
      }
      for (const subjectId of subjectIds) {
        desired.set(`${classId}:${subjectId}`, { classId, subjectId });
      }
    }

    const existingByPair = new Map<string, TeacherAssignmentRow[]>();
    for (const row of assignments) {
      if (row.component !== 'EXAM') continue;
      const key = `${row.classId}:${row.subjectId}`;
      const list = existingByPair.get(key) ?? [];
      list.push(row);
      existingByPair.set(key, list);
    }

    const toDelete: string[] = [];
    for (const [key, rows] of existingByPair) {
      if (desired.has(key)) {
        // Keep one row per class+subject; clean up duplicates from older exams.
        toDelete.push(...rows.slice(1).map((row) => row.id));
      } else {
        toDelete.push(...rows.map((row) => row.id));
      }
    }

    const creates: Array<{ classId: string; subjectId: string }> = [];
    for (const [key, pair] of desired) {
      if (!existingByPair.has(key)) creates.push(pair);
    }

    if (!toDelete.length && !creates.length) {
      onSaved('Assignments are already up to date.');
      onClose();
      return;
    }

    setBusy(true);
    try {
      if (creates.length) {
        const createClassIds = [...new Set(creates.map((row) => row.classId))];
        await apiPost('/report-cards/score-assignments', {
          teacherId: teacher.id,
          classes: createClassIds.map((classId) => ({
            classId,
            subjectIds: creates.filter((row) => row.classId === classId).map((row) => row.subjectId),
          })),
        });
      }
      if (toDelete.length) {
        await Promise.all(
          toDelete.map((id) => apiDelete(`/report-cards/score-assignments/${id}`)),
        );
      }
      onSaved(
        `${creates.length ? `${creates.length} added` : ''}${
          creates.length && toDelete.length ? ' · ' : ''
        }${toDelete.length ? `${toDelete.length} removed` : ''} for ${teacher.user_name}.`,
      );
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Could not save the assignments.');
    } finally {
      setBusy(false);
    }
  };

  const removeAll = async () => {
    if (busy || !teacher || !assignments.length) return;
    if (
      !window.confirm(
        `Remove all ${assignments.length} Examination subject assignment(s) for ${teacher.user_name}?`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await Promise.all(
        assignments.map((row) => apiDelete(`/report-cards/score-assignments/${row.id}`)),
      );
      onSaved(`All assignments removed for ${teacher.user_name}.`);
      onClose();
    } catch (err: any) {
      setError(err?.message ?? 'Could not remove the assignments.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[60] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={() => {
          if (!busy) onClose();
        }}
        className={`absolute inset-0 bg-brand-900/60 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        className="absolute inset-0 flex items-center justify-center p-4"
        onClick={(event) => {
          if (event.target === event.currentTarget && !busy) onClose();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit teacher assignments"
          className={`flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded bg-white shadow-xl transition-all ${
            open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          }`}
        >
          <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[.18em] text-brand-700">
                Examination assignments
              </p>
              <h2 className="mt-0.5 truncate font-display text-lg font-extrabold">
                {teacher ? teacher.user_name : 'Teacher'}
              </h2>
              <p className="mt-0.5 truncate text-xs text-muted">
                {teacher?.user_email} · {classIds.length} class{classIds.length === 1 ? '' : 'es'} ·{' '}
                {selectedCount} subject{selectedCount === 1 ? '' : 's'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              aria-label="Close assignment editor"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-line text-brand-800 hover:bg-brand-50 disabled:opacity-40"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
            {assignments.length === 0 && classIds.length === 0 && (
              <p className="rounded border border-dashed border-line bg-cream px-3 py-4 text-sm text-muted">
                This teacher has no Examination assignments yet. Add a class below to begin.
              </p>
            )}

            {classIds.map((classId) => {
              const setup = setups.find((row) => row.classId === classId);
              const className = classes.find((cls) => cls.id === classId)?.name ?? 'Class';
              const current = selected[classId] ?? [];
              const allSelected =
                Boolean(setup?.subjects.length) &&
                setup!.subjects.every((subject) => current.includes(subject.id));
              return (
                <div key={classId} className="rounded border border-line bg-white p-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-ink">{className}</p>
                      <p className="text-[11px] text-muted">
                        {setup
                          ? setup.exam
                            ? setup.exam.exam_name
                            : 'No Examination exam for this class'
                          : 'Loading subjects…'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {setup?.subjects.length ? (
                        <button
                          type="button"
                          onClick={() => toggleAll(setup)}
                          className="text-[11px] font-bold text-brand-700 underline underline-offset-4 hover:text-brand-500"
                        >
                          {allSelected ? 'Clear subjects' : 'Select all'}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => removeClass(classId)}
                        aria-label={`Remove ${className} from this assignment`}
                        className="flex h-7 w-7 items-center justify-center rounded text-muted hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 size={13} aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {setup && !setup.exam ? (
                    <p className="mt-3 flex items-start gap-2 rounded border border-rose-200 bg-rose-50 px-2.5 py-2 text-[11px] text-rose-800">
                      <AlertTriangle size={13} aria-hidden="true" className="mt-0.5 shrink-0" />
                      Create an exam with “Examination” in the name before assigning subjects here.
                    </p>
                  ) : !setup ? (
                    <div className="mt-3 h-16 animate-pulse rounded bg-brand-50" />
                  ) : setup.subjects.length === 0 ? (
                    <p className="mt-2 text-[11px] text-muted">This class has no subjects.</p>
                  ) : (
                    <div className="mt-3 grid max-h-44 gap-1 overflow-y-auto pr-1 sm:grid-cols-2">
                      {setup.subjects.map((subject) => (
                        <label
                          key={subject.id}
                          className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-[11px] font-semibold hover:bg-cream"
                        >
                          <input
                            type="checkbox"
                            checked={current.includes(subject.id)}
                            onChange={() => toggleSubject(classId, subject.id)}
                            className="h-4 w-4 accent-brand-500"
                          />
                          <span className="min-w-0 truncate">{subject.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            <label className="block text-sm font-semibold">
              Add another class
              <select
                value=""
                onChange={(event) => {
                  addClass(event.target.value);
                  event.currentTarget.value = '';
                }}
                className={`${selectClass} mt-2`}
              >
                <option value="">— Choose a class —</option>
                {availableClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </label>

            <p className="flex items-start gap-2 text-xs leading-5 text-muted">
              <BookOpen size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
              Ticked subjects are saved as Examination score assignments. Unticked subjects are
              removed when you save; use “Remove all” to clear the teacher completely.
            </p>

            {error && (
              <p role="alert" className="border-l-2 border-rose-400 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {error}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-cream/60 px-5 py-4">
            <button
              type="button"
              onClick={() => void removeAll()}
              disabled={busy || assignments.length === 0}
              className="inline-flex min-h-11 items-center gap-2 rounded border border-rose-200 bg-white px-4 text-sm font-bold text-rose-700 hover:border-rose-400 hover:bg-rose-50 disabled:opacity-40"
            >
              <Trash2 size={14} aria-hidden="true" /> Remove all
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="min-h-11 rounded border border-line bg-white px-4 text-sm font-bold text-brand-800 hover:border-brand-500 disabled:opacity-40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void save()}
                disabled={busy || (classIds.length > 0 && setupQuery.isPending)}
                className="inline-flex min-h-11 items-center gap-2 rounded bg-brand-500 px-5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                <Plus size={15} aria-hidden="true" />
                {busy ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
