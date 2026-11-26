import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Download,
  Eye,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  Card,
  CardHead,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  Modal,
  PageHeader,
  Pagination,
  Pill,
  StatTile,
  Td,
  Th,
} from '@/components/dashboard/DashboardUI';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import { usePagedList } from '@/lib/pagedQuery';
import { ROUTES } from '@/routes/paths';
import type {
  DatabaseImportResult,
  ExamDatabaseOverview,
  ExamDatabaseRow,
} from './exam-database/types';

const inputClass =
  'mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500';

const formatDate = (value?: string | null) => {
  if (!value) return 'Not yet';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not yet' : date.toLocaleString();
};

const formatBytes = (bytes: number) => {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const modeLabel = (mode?: string | null) =>
  mode === 'MOVE' ? 'Exported & removed' : mode === 'COPY' ? 'Exported only' : 'No exports yet';

export const AdminDatabasePage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  const list = usePagedList<ExamDatabaseRow>(
    ['exam-databases', query],
    (page, limit) =>
      apiGet<ExamDatabaseRow[]>('/exam-databases', {
        searchTerm: query || undefined,
        page,
        limit,
      }),
    { initialLimit: 10 },
  );

  const overview = useQuery({
    queryKey: ['exam-databases-overview'],
    queryFn: async () => (await apiGet<ExamDatabaseOverview>('/exam-databases/overview')).data,
  });
  const stats = overview.data;

  const [notice, setNotice] = useState<string | null>(null);

  // Create / rename
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExamDatabaseRow | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Import
  const [importTarget, setImportTarget] = useState<ExamDatabaseRow | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<DatabaseImportResult | null>(null);

  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = () => {
    list.invalidate();
    overview.refetch();
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', description: '' });
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (database: ExamDatabaseRow) => {
    setEditing(database);
    setForm({ name: database.name, description: database.description ?? '' });
    setFormError(null);
    setFormOpen(true);
  };

  const saveForm = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setFormError('Enter a database name.');
      return;
    }

    setFormBusy(true);
    setFormError(null);
    try {
      if (editing) {
        await apiPatch(`/exam-databases/${editing.id}`, {
          name: form.name.trim(),
          description: form.description.trim(),
        });
        setNotice(`Renamed database to "${form.name.trim()}".`);
      } else {
        await apiPost('/exam-databases', {
          name: form.name.trim(),
          description: form.description.trim(),
        });
        setNotice(`Database "${form.name.trim()}" created. Export a class into it from Exam & Test.`);
      }
      setFormOpen(false);
      setEditing(null);
      refresh();
    } catch (error: any) {
      setFormError(error?.message ?? 'Save failed');
    } finally {
      setFormBusy(false);
    }
  };

  const openDetails = (database: ExamDatabaseRow) => {
    navigate(`${ROUTES.adminDatabase}/${database.id}`);
  };

  const remove = async (database: ExamDatabaseRow) => {
    if (
      !window.confirm(
        `Delete the database "${database.name}"? The live Exam & Test data is not touched. This cannot be undone.`,
      )
    ) {
      return;
    }

    setBusyId(database.id);
    setNotice(null);
    try {
      await apiDelete(`/exam-databases/${database.id}`);
      setNotice(`Database "${database.name}" deleted.`);
      refresh();
    } catch (error: any) {
      setNotice(error?.message ?? 'Delete failed');
    } finally {
      setBusyId(null);
    }
  };

  const download = async (database: ExamDatabaseRow) => {
    setBusyId(database.id);
    setNotice(null);
    try {
      const response = await apiGet(`/exam-databases/${database.id}/download`);
      const blob = new Blob([JSON.stringify(response.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${database.name.replace(/[^a-z0-9-_]+/gi, '-').toLowerCase() || 'exam-database'}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setNotice(`Downloaded "${database.name}".`);
    } catch (error: any) {
      setNotice(error?.message ?? 'Download failed');
    } finally {
      setBusyId(null);
    }
  };

  const openImport = (database: ExamDatabaseRow) => {
    setImportTarget(database);
    setImportResult(null);
    setImportError(null);
    setImportBusy(false);
  };

  const runImport = async () => {
    if (!importTarget) return;
    setImportBusy(true);
    setImportError(null);
    try {
      const response = await apiPost<DatabaseImportResult>(
        `/exam-databases/${importTarget.id}/import`,
      );
      setImportResult(response.data);
      setNotice(
        `Imported "${importTarget.name}" into Exam & Test: ${response.data.exams} exam(s), ${response.data.questions} question(s), ${response.data.results} result(s).`,
      );
      queryClient.invalidateQueries({ queryKey: ['exam-databases'] });
      queryClient.invalidateQueries({ queryKey: ['exam-databases-overview'] });
      queryClient.invalidateQueries({ queryKey: ['exam-classes'] });
      queryClient.invalidateQueries({ queryKey: ['exams-overview'] });
      queryClient.invalidateQueries({ queryKey: ['class-exams'] });
      queryClient.invalidateQueries({ queryKey: ['all-exams'] });
      queryClient.invalidateQueries({ queryKey: ['test-results'] });
      list.invalidate();
      overview.refetch();
    } catch (error: any) {
      setImportError(error?.message ?? 'Import failed');
    } finally {
      setImportBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Exam & Test"
        title="Database"
        text="Restorable copies of class exams, subjects, questions and results. Export a class from Exam & Test, then import it back whenever you need it."
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
          >
            <Plus aria-hidden="true" size={16} className="mr-2" /> New Database
          </button>
        }
      />

      {notice && (
        <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">
          {notice}
        </p>
      )}

      {overview.isPending ? (
        <LoadingSkeleton rows={2} />
      ) : overview.isError || !stats ? (
        <ErrorState message="Could not load database totals" onRetry={() => overview.refetch()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <StatTile label="Databases" value={String(stats.databases)} hint="named archives" />
          <StatTile label="Classes" value={String(stats.classes)} hint="saved snapshots" />
          <StatTile label="Exams" value={String(stats.exams)} hint={`${stats.questions} questions`} />
          <StatTile label="Results" value={String(stats.results)} hint={`${stats.attempts} attempts`} />
          <StatTile label="Storage" value={formatBytes(stats.sizeBytes)} hint="JSON snapshot size" />
        </div>
      )}

      <Card>
        <CardHead title="Saved databases" sub={`${list.total} database(s)`} />

        <form
          className="flex flex-wrap gap-2 border-b border-line px-5 py-4"
          onSubmit={(event) => {
            event.preventDefault();
            setQuery(search);
            list.resetPage();
          }}
        >
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search database name..."
            aria-label="Search databases"
            className="min-h-11 w-full max-w-sm rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500"
          />
          <button
            type="submit"
            className="min-h-11 rounded bg-brand-900 px-4 text-sm font-bold text-white hover:bg-brand-700"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setQuery('');
                list.resetPage();
              }}
              className="min-h-11 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink"
            >
              Reset
            </button>
          )}
        </form>

        {list.isPending ? (
          <div className="px-5 py-5">
            <LoadingSkeleton rows={4} />
          </div>
        ) : list.isError ? (
          <div className="px-5 py-5">
            <ErrorState message="Could not load databases" onRetry={() => list.refetch()} />
          </div>
        ) : list.rows.length === 0 ? (
          <div className="px-5 py-5">
            <EmptyState
              message={
                query
                  ? 'No databases match your search.'
                  : 'No databases yet. Export a class from Exam & Test, or create an empty database here.'
              }
            />
          </div>
        ) : (
          <>
            <div className="scroll-db max-h-[32rem] overflow-auto">
              <table
                className={`w-full min-w-[980px] text-left text-sm transition-opacity ${
                  list.isFetching ? 'opacity-60' : ''
                }`}
              >
                <thead>
                  <tr>
                    <Th>Database</Th>
                    <Th>Contents</Th>
                    <Th>Last activity</Th>
                    <Th>Size</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {list.rows.map((database) => (
                    <tr key={database.id}>
                      <Td>
                        <span className="font-bold">{database.name}</span>
                        {database.description && (
                          <span className="mt-0.5 block max-w-xs text-xs text-muted">
                            {database.description}
                          </span>
                        )}
                        <span className="mt-1 block text-xs text-muted">
                          {database.createdByName ? `Created by ${database.createdByName} · ` : ''}
                          {formatDate(database.createdAt)}
                        </span>
                      </Td>
                      <Td>
                        {database.examCount === 0 ? (
                          <span className="text-xs text-muted">Empty database</span>
                        ) : (
                          <span className="flex flex-wrap gap-1.5 text-xs">
                            <span className="rounded bg-brand-50 px-2 py-1 font-bold text-brand-700">
                              {database.classCount} class(es)
                            </span>
                            <span className="rounded bg-sky-50 px-2 py-1 font-bold text-sky-800">
                              {database.examCount} exam(s)
                            </span>
                            <span className="rounded bg-emerald-50 px-2 py-1 font-bold text-emerald-800">
                              {database.questionCount} question(s)
                            </span>
                            <span className="rounded bg-violet-50 px-2 py-1 font-bold text-violet-800">
                              {database.resultCount} result(s)
                            </span>
                          </span>
                        )}
                      </Td>
                      <Td>
                        <Pill tone={database.lastMode === 'MOVE' ? 'rose' : 'emerald'}>
                          {modeLabel(database.lastMode)}
                        </Pill>
                        <span className="mt-1 block text-xs text-muted">
                          Export: {formatDate(database.lastExportedAt)}
                        </span>
                        {database.lastImportedAt && (
                          <span className="block text-xs text-muted">
                            Import: {formatDate(database.lastImportedAt)}
                          </span>
                        )}
                      </Td>
                      <Td className="text-xs text-muted">{formatBytes(database.sizeBytes)}</Td>
                      <Td>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openImport(database)}
                            disabled={database.examCount === 0 || busyId === database.id}
                            className="inline-flex items-center gap-1 rounded bg-brand-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <Upload aria-hidden="true" size={12} /> Import
                          </button>
                          <button
                            type="button"
                            onClick={() => openDetails(database)}
                            className="inline-flex items-center gap-1 rounded border border-line px-2.5 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700"
                          >
                            <Eye aria-hidden="true" size={12} /> View
                          </button>
                          <button
                            type="button"
                            onClick={() => download(database)}
                            disabled={busyId === database.id}
                            aria-label={`Download ${database.name}`}
                            title="Download JSON"
                            className="rounded border border-line px-2.5 py-2 text-xs font-bold hover:border-brand-500 hover:text-brand-700 disabled:opacity-50"
                          >
                            <Download aria-hidden="true" size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEdit(database)}
                            aria-label={`Rename ${database.name}`}
                            title="Rename"
                            className="rounded border border-line px-2.5 py-2 text-xs font-bold hover:border-brand-500 hover:text-brand-700"
                          >
                            <Pencil aria-hidden="true" size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(database)}
                            disabled={busyId === database.id}
                            aria-label={`Delete ${database.name}`}
                            title="Delete database"
                            className="rounded border border-line px-2.5 py-2 text-xs font-bold text-rose-700 hover:border-rose-300 disabled:opacity-50"
                          >
                            <Trash2 aria-hidden="true" size={12} />
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination
              total={list.total}
              page={list.page}
              pageCount={list.pageCount}
              limit={list.limit}
              onPage={list.setPage}
              onLimit={list.setLimit}
              disabled={list.isFetching}
              noun="database(s)"
            />
          </>
        )}
      </Card>

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Rename database' : 'New database'}
      >
        <form onSubmit={saveForm} className="space-y-4">
          <div>
            <label className="text-sm font-semibold" htmlFor="database-name">
              Database name
            </label>
            <input
              id="database-name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="e.g. JSS 2 Diamond archives"
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="database-description">
              Description <span className="font-normal text-muted">(optional)</span>
            </label>
            <textarea
              id="database-description"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              rows={3}
              placeholder="What is this database for?"
              className={`${inputClass} py-3`}
            />
          </div>
          {formError && (
            <p role="alert" className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {formError}
            </p>
          )}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="min-h-11 flex-1 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={formBusy}
              className="min-h-11 flex-1 rounded bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {formBusy ? 'Saving...' : editing ? 'Save changes' : 'Create database'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!importTarget}
        onClose={() => {
          if (importBusy) return;
          setImportTarget(null);
          setImportResult(null);
        }}
        title={importResult ? 'Import complete' : `Import ${importTarget?.name ?? 'database'}`}
        size="lg"
      >
        {importResult ? (
          <div className="space-y-4">
            <div className="border-l-2 border-lime-accent bg-brand-50 px-4 py-4">
              <p className="font-display text-base font-extrabold text-brand-900">Exam &amp; Test restored</p>
              <p className="mt-1 text-sm text-brand-800">
                {importResult.snapshots} snapshot(s), {importResult.exams} exam(s),{' '}
                {importResult.questions} question(s), {importResult.results} result(s) and{' '}
                {importResult.attempts} answer attempt(s).
              </p>
              {importResult.classesCreated > 0 && (
                <p className="mt-1 text-xs text-brand-800">
                  {importResult.classesCreated} class(es) were recreated.
                </p>
              )}
            </div>

            {importResult.warnings.length > 0 && (
              <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <p className="flex items-center gap-2 font-bold">
                  <AlertTriangle size={15} aria-hidden="true" /> Imported with warnings
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                  {importResult.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
                {importResult.missingStudentEmails.length > 0 && (
                  <p className="mt-2 text-xs">
                    Missing pupils: {importResult.missingStudentEmails.join(', ')}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setImportTarget(null);
                  setImportResult(null);
                }}
                className="min-h-11 rounded bg-brand-500 px-5 text-sm font-bold text-white hover:bg-brand-700"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="border border-line bg-cream px-4 py-3 text-sm text-muted">
              <p className="font-bold text-ink">This will write the snapshot back to Exam &amp; Test</p>
              <p className="mt-1">
                {importTarget?.classCount ?? 0} class(es), {importTarget?.examCount ?? 0} exam(s),{' '}
                {importTarget?.questionCount ?? 0} question(s) and {importTarget?.resultCount ?? 0} result(s).
              </p>
            </div>

            <div className="border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="flex items-center gap-2 font-bold">
                <AlertTriangle size={15} aria-hidden="true" /> Before you import
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-xs">
                <li>Existing exams, questions and results with the same identity are updated in place.</li>
                <li>Results are restored only when the pupil's email still exists in this workspace.</li>
                <li>The class and its pupils are never duplicated by a normal export/import cycle.</li>
              </ul>
            </div>

            {importError && (
              <p role="alert" className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {importError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setImportTarget(null)}
                disabled={importBusy}
                className="min-h-11 flex-1 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={runImport}
                disabled={importBusy || (importTarget?.examCount ?? 0) === 0}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
              >
                <Upload aria-hidden="true" size={14} />
                {importBusy ? 'Importing...' : 'Import now'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
