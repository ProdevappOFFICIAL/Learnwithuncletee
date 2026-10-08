import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, Modal, PageHeader, Pagination, StatTile } from '@/components/dashboard/DashboardUI';
import { useAuth } from '@/context/AuthContext';
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api';
import { LIST_STALE, usePagedList } from '@/lib/pagedQuery';
import { ChevronRight, GraduationCap, Pencil, Plus, Trash2 } from 'lucide-react';

interface ClassItem {
  id: string;
  name: string;
  _count?: { exams?: number; subjects?: number; students?: number };
}

interface ExamsOverview {
  classes: number;
  exams: number;
  subjects: number;
  questions: number;
  attempts: number;
  pupils: number;
  visibleExams: number;
  hiddenExams: number;
}

const inputClass = 'mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500';

export const ExamClassesPage = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  // Workspace-wide totals — differentiates this page from class management:
  // the whole Exam & Test footprint at a glance.
  const overview = useQuery({
    queryKey: ['exams-overview'],
    queryFn: () => apiGet<ExamsOverview>('/exams/overview'),
    staleTime: LIST_STALE,
  });
  const stats = overview.data?.data;

  const classes = usePagedList<ClassItem>(
    ['exam-classes', query],
    (page, limit) => apiGet<ClassItem[]>('/classes', { searchTerm: query || undefined, page, limit }),
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ClassItem | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setNotice(null);
    setModalOpen(true);
  };

  const openEdit = (cls: ClassItem) => {
    setEditing(cls);
    setName(cls.name);
    setNotice(null);
    setModalOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNotice('Enter a class name.');
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      if (editing) {
        await apiPut(`/classes/${editing.id}`, { name: name.trim() });
        setNotice(`Class renamed to "${name.trim()}".`);
      } else {
        await apiPost('/classes', { name: name.trim(), workspaceId: user?.workspaceId });
        setNotice(`Class "${name.trim()}" created. Click it to add exams.`);
      }
      setModalOpen(false);
      setEditing(null);
      setName('');
      classes.invalidate();
      overview.refetch();
    } catch (err: any) {
      setNotice(err?.message ?? 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (cls: ClassItem) => {
    if (!confirm(`Delete class "${cls.name}"? Its assignments are removed too. This cannot be undone.`)) return;
    try {
      await apiDelete(`/classes/${cls.id}`);
      setNotice(`Class "${cls.name}" deleted.`);
      classes.invalidate();
      overview.refetch();
    } catch (err: any) {
      setNotice(err?.message ?? 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Exam & Test"
        title="Classes"
        text="The whole examination footprint, then drill into a class to manage its exams."
        actions={
          <button type="button" onClick={openCreate} className="inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
            <Plus aria-hidden="true" size={16} className="mr-2" /> Add New Class
          </button>
        }
      />
      {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

      {overview.isPending ? (
        <LoadingSkeleton rows={2} />
      ) : overview.isError || !stats ? (
        <ErrorState message="Could not load totals" onRetry={() => overview.refetch()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile label="Classes" value={String(stats.classes)} hint="grades with exams" />
          <StatTile label="Exams" value={String(stats.exams)} hint={`${stats.visibleExams} visible · ${stats.hiddenExams} hidden`} />
          <StatTile label="Subjects" value={String(stats.subjects)} hint="across all exams" />
          <StatTile label="Questions" value={String(stats.questions)} hint="in question banks" />
          <StatTile label="Attempts" value={String(stats.attempts)} hint="pupil sittings recorded" />
          <StatTile label="Pupils" value={String(stats.pupils)} hint="eligible candidates" />
        </div>
      )}

      <Card>
        <CardHead title="All classes" sub={`${classes.total} shown`} />
        <form
          className="flex flex-wrap gap-2 border-b border-line px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search);
            classes.resetPage();
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by class name…"
            aria-label="Search classes"
            className="min-h-11 w-full max-w-sm rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500"
          />
          <button type="submit" className="min-h-11 rounded bg-brand-900 px-4 text-sm font-bold text-white hover:bg-brand-700">Search</button>
          {search && (
            <button type="button" onClick={() => { setSearch(''); setQuery(''); classes.resetPage(); }} className="min-h-11 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink">
              Reset
            </button>
          )}
        </form>
        {classes.isPending ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={4} /></div>
        ) : classes.isError ? (
          <div className="px-5 py-5"><ErrorState message="Could not load classes" onRetry={() => classes.refetch()} /></div>
        ) : classes.rows.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message={query ? 'No classes match your search.' : 'No classes yet — create the first one.'} /></div>
        ) : (
          <>
            <ul className={`divide-y divide-line transition-opacity ${classes.isFetching ? 'opacity-60' : ''}`}>
              {classes.rows.map((cls) => (
                <li key={cls.id} className="group flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <Link to={`/dashboard/admin/exams/${cls.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 group-hover:bg-brand-500 group-hover:text-white">
                      <GraduationCap size={18} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-display text-base font-extrabold group-hover:text-brand-700">{cls.name}</span>
                      <span className="mt-0.5 flex flex-wrap gap-2 text-xs text-muted">
                        <span>{cls._count?.exams ?? 0} exams</span>
                        <span>·</span>
                        <span>{cls._count?.subjects ?? 0} subjects</span>
                        <span>·</span>
                        <span>{cls._count?.students ?? 0} pupils</span>
                      </span>
                    </span>
                    <ChevronRight size={16} aria-hidden="true" className="ml-auto shrink-0 text-muted group-hover:text-brand-700" />
                  </Link>
                  <span className="flex shrink-0 gap-2 border-t border-line pt-3 sm:border-t-0 sm:pt-0 sm:pl-4">
                    <button type="button" onClick={() => openEdit(cls)} aria-label={`Edit ${cls.name}`} title="Edit" className="rounded border border-line px-3 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700">
                      <Pencil aria-hidden="true" size={14} />
                    </button>
                    <button type="button" onClick={() => remove(cls)} aria-label={`Delete ${cls.name}`} title="Delete" className="rounded border border-line px-3 py-1.5 text-xs font-bold text-rose-700 hover:border-rose-300">
                      <Trash2 aria-hidden="true" size={14} />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
            <Pagination
              total={classes.total}
              page={classes.page}
              pageCount={classes.pageCount}
              limit={classes.limit}
              onPage={classes.setPage}
              onLimit={classes.setLimit}
              disabled={classes.isFetching}
              noun="class(es)"
            />
          </>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Class' : 'New Class'}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="text-sm font-semibold" htmlFor="class-name">Class Name</label>
            <input
              id="class-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. JSS1, Grade 10-A, Final Year"
              required
              className={`${inputClass} text-sm`}
            />
            <p className="mt-1 text-xs text-muted">This name will be visible to students and teachers.</p>
          </div>
          {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="min-h-11 flex-1 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="min-h-11 flex-1 rounded bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
              {busy ? 'Saving…' : editing ? 'Save Changes' : 'Create Class'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
