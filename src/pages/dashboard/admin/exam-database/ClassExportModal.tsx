import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Archive, Database, Trash2 } from 'lucide-react';
import { Modal } from '@/components/dashboard/DashboardUI';
import { apiGet, apiPost } from '@/lib/api';
import type { ClassExportResult, ExamDatabaseMode, ExamDatabaseRow } from './types';

const inputClass = 'mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500';

const MODE_COPY: ExamDatabaseMode = 'COPY';
const MODE_MOVE: ExamDatabaseMode = 'MOVE';

export const ClassExportModal = ({
  open,
  onClose,
  classId,
  classLabel,
  onExported,
}: {
  open: boolean;
  onClose: () => void;
  classId: string;
  classLabel: string;
  onExported?: (result: ClassExportResult) => void;
}) => {
  const queryClient = useQueryClient();
  const databases = useQuery({
    queryKey: ['exam-databases', 'export-options'],
    queryFn: async () => (await apiGet<ExamDatabaseRow[]>('/exam-databases', { limit: 100 })).data,
    enabled: open,
    staleTime: 30_000,
  });

  const [target, setTarget] = useState('new');
  const [newName, setNewName] = useState('');
  const [mode, setMode] = useState<ExamDatabaseMode>(MODE_COPY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<ClassExportResult | null>(null);

  useEffect(() => {
    if (!open) return;
    setTarget('new');
    setNewName(`${classLabel} backup`);
    setMode(MODE_COPY);
    setBusy(false);
    setError(null);
    setDone(null);
  }, [open, classLabel]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (target === 'new' && !newName.trim()) {
      setError('Give the new database a name.');
      return;
    }

    setBusy(true);
    try {
      const response = await apiPost<ClassExportResult>('/exam-databases/export', {
        classId,
        mode,
        ...(target === 'new' ? { databaseName: newName.trim() } : { databaseId: target }),
      });
      setDone(response.data);
      onExported?.(response.data);
      queryClient.invalidateQueries({ queryKey: ['exam-databases'] });
      queryClient.invalidateQueries({ queryKey: ['exam-databases-overview'] });
      queryClient.invalidateQueries({ queryKey: ['exam-classes'] });
      queryClient.invalidateQueries({ queryKey: ['exams-overview'] });
      queryClient.invalidateQueries({ queryKey: ['class-exams'] });
    } catch (err: any) {
      setError(err?.message ?? 'Export failed');
    } finally {
      setBusy(false);
    }
  };

  const title = done ? 'Class exported' : `Export ${classLabel || 'class'}`;

  return (
    <Modal open={open} onClose={onClose} title={title} size="lg">
      {done ? (
        <div className="space-y-5">
          <div className="border-l-2 border-lime-accent bg-brand-50 px-4 py-4">
            <p className="font-display text-base font-extrabold text-brand-900">
              Saved to “{done.database.name}”
            </p>
            <p className="mt-1 text-sm text-brand-800">
              {done.snapshot.className}: {done.snapshot.summary.exams} exam(s),{' '}
              {done.snapshot.summary.subjects} subject(s), {done.snapshot.summary.questions} question(s),{' '}
              {done.snapshot.summary.results} result(s) and {done.snapshot.summary.attempts} answer attempt(s).
            </p>
          </div>

          {mode === MODE_MOVE && (
            <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <p className="flex items-center gap-2 font-bold">
                <AlertTriangle size={15} aria-hidden="true" /> Removed from Exam &amp; Test
              </p>
              <p className="mt-1">
                {done.deletedExams} exam(s) and their questions/results were deleted from the live class. The
                class and its pupils were kept, so you can restore everything from the Database page.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 rounded bg-brand-500 px-5 text-sm font-bold text-white hover:bg-brand-700"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div className="border border-line bg-cream px-4 py-3 text-sm text-muted">
            <p className="font-bold text-ink">What gets saved</p>
            <p className="mt-1">
              Every exam in this class, its subjects, all questions, plus online and offline results with their
              per-question answer attempts.
            </p>
          </div>

          <div>
            <label className="text-sm font-semibold" htmlFor="export-database">
              Save into database
            </label>
            <select
              id="export-database"
              value={target}
              onChange={(event) => setTarget(event.target.value)}
              className={inputClass}
            >
              <option value="new">+ New database</option>
              {(databases.data ?? []).map((database) => (
                <option key={database.id} value={database.id}>
                  {database.name} ({database.examCount} exam(s))
                </option>
              ))}
            </select>
            {databases.isFetching && <p className="mt-1 text-xs text-muted">Loading databases…</p>}
          </div>

          {target === 'new' && (
            <div>
              <label className="text-sm font-semibold" htmlFor="export-database-name">
                New database name
              </label>
              <input
                id="export-database-name"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder={`e.g. ${classLabel || 'Class'} mock exams`}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-muted">
                A database can hold several classes. Exporting the same class again replaces its older snapshot.
              </p>
            </div>
          )}

          <div>
            <p className="text-sm font-semibold">After exporting</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setMode(MODE_COPY)}
                aria-pressed={mode === MODE_COPY}
                className={`rounded border px-4 py-3 text-left transition-colors ${
                  mode === MODE_COPY
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-line bg-white hover:border-brand-300'
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-extrabold text-ink">
                  <Archive size={15} aria-hidden="true" /> Export only
                </span>
                <span className="mt-1 block text-xs text-muted">
                  Keep the class data in Exam &amp; Test. You get a restorable copy.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setMode(MODE_MOVE)}
                aria-pressed={mode === MODE_MOVE}
                className={`rounded border px-4 py-3 text-left transition-colors ${
                  mode === MODE_MOVE
                    ? 'border-rose-400 bg-rose-50'
                    : 'border-line bg-white hover:border-rose-200'
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-extrabold text-rose-800">
                  <Trash2 size={15} aria-hidden="true" /> Export &amp; delete
                </span>
                <span className="mt-1 block text-xs text-muted">
                  Save first, then remove this class's exams, questions and results from Exam &amp; Test.
                </span>
              </button>
            </div>
          </div>

          {mode === MODE_MOVE && (
            <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <p className="flex items-center gap-2 font-bold">
                <AlertTriangle size={15} aria-hidden="true" /> This clears live exam data
              </p>
              <p className="mt-1">
                The class and its pupils stay. All exams in this class, their questions, results and answer
                attempts are deleted after the database copy is written.
              </p>
            </div>
          )}

          {error && (
            <p role="alert" className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 flex-1 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded px-4 text-sm font-bold text-white disabled:opacity-60 ${
                mode === MODE_MOVE ? 'bg-rose-700 hover:bg-rose-800' : 'bg-brand-500 hover:bg-brand-700'
              }`}
            >
              <Database size={15} aria-hidden="true" />
              {busy ? 'Exporting…' : mode === MODE_MOVE ? 'Export & delete' : 'Export'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
