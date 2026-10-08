import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, Modal, PageHeader, Pagination, Pill } from '@/components/dashboard/DashboardUI';
import { useAuth, useResource } from '@/context/AuthContext';
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api';
import { usePagedList } from '@/lib/pagedQuery';
import { ROUTES } from '@/routes/paths';
import { BookOpen, ChevronRight, Clock, Eye, EyeOff, FileText, Pencil, Plus, Trash2, Users } from 'lucide-react';

interface ExamItem {
  id: string;
  exam_name: string;
  minutes: number;
  visible?: boolean;
  class?: { name: string };
  _count?: { questions?: number; results?: number; subjects?: number };
  students?: number;
}

interface ClassInfo {
  id: string;
  name: string;
}

type VisibilityFilter = '' | 'visible' | 'hidden';

const inputClass = 'mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500';

export const ClassExamsPage = () => {
  const { classId = '' } = useParams<{ classId: string }>();
  const { user } = useAuth();
  const cls = useResource<ClassInfo>(classId ? `/classes/${classId}` : null);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [visibility, setVisibility] = useState<VisibilityFilter>('');

  const exams = usePagedList<ExamItem>(
    ['class-exams', classId, query],
    (page, limit) => apiGet<ExamItem[]>('/exams', { classId, searchTerm: query || undefined, page, limit }),
  );
  // Visibility is a client-side slice of the loaded workspace set — the exam
  // table is small per class, so one extra unfiltered fetch is overkill.
  const rows = exams.rows.filter((e) =>
    visibility === '' || (visibility === 'visible' ? (e.visible ?? true) : !(e.visible ?? true)),
  );

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExamItem | null>(null);
  const [form, setForm] = useState({ exam_name: '', minutes: '60', visible: true });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const openCreate = () => {
    setEditing(null);
    setForm({ exam_name: '', minutes: '60', visible: true });
    setNotice(null);
    setModalOpen(true);
  };

  const openEdit = (exam: ExamItem) => {
    setEditing(exam);
    setForm({ exam_name: exam.exam_name, minutes: String(exam.minutes), visible: exam.visible ?? true });
    setNotice(null);
    setModalOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.exam_name.trim()) {
      setNotice('Enter an exam name.');
      return;
    }
    const minutes = Math.max(1, parseInt(form.minutes, 10) || 60);
    setBusy(true);
    setNotice(null);
    try {
      if (editing) {
        await apiPut(`/exams/${editing.id}`, { exam_name: form.exam_name.trim(), minutes, visible: form.visible });
        setNotice('Exam updated.');
      } else {
        await apiPost('/exams', { exam_name: form.exam_name.trim(), minutes, visible: form.visible, classId, workspaceId: user?.workspaceId });
        setNotice(`Exam "${form.exam_name.trim()}" created under ${cls.data?.name ?? 'this class'}.`);
      }
      setModalOpen(false);
      setEditing(null);
      exams.invalidate();
    } catch (err: any) {
      setNotice(err?.message ?? 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (exam: ExamItem) => {
    if (!confirm(`Delete exam "${exam.exam_name}"? Its questions are removed too. This cannot be undone.`)) return;
    try {
      await apiDelete(`/exams/${exam.id}`);
      setNotice(`Exam "${exam.exam_name}" deleted.`);
      exams.invalidate();
    } catch (err: any) {
      setNotice(err?.message ?? 'Delete failed');
    }
  };

  const toggleVisibility = async (exam: ExamItem) => {
    try {
      await apiPut(`/exams/${exam.id}`, { visible: !(exam.visible ?? true) });
      exams.invalidate();
    } catch (err: any) {
      setNotice(err?.message ?? 'Update failed');
    }
  };

  const className = cls.data?.name ?? 'Class';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Exam & Test · ${className}`}
        title={`Exams — ${className}`}
        text="Each exam belongs to this class. Select an exam to manage its subjects and questions."
        actions={
          <button type="button" onClick={openCreate} className="inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
            <Plus aria-hidden="true" size={16} className="mr-2" /> Add New Exam
          </button>
        }
      />
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link to={ROUTES.adminExams} className="font-bold text-brand-700 hover:text-brand-500">Classes</Link>
        <span className="px-2">/</span>
        <span className="text-ink" aria-current="page">{className}</span>
      </nav>
      {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

      <Card>
        <CardHead title="Exams in this class" sub={`${exams.total} shown`} />
        <form
          className="flex flex-wrap gap-2 border-b border-line px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search);
            exams.resetPage();
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by exam name…"
            aria-label="Search exams"
            className="min-h-11 w-full max-w-xs rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500"
          />
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as VisibilityFilter)}
            aria-label="Filter by visibility"
            className="min-h-11 rounded border border-line bg-white px-3 text-sm font-semibold"
          >
            <option value="">All statuses</option>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
          </select>
          <button type="submit" className="min-h-11 rounded bg-brand-900 px-4 text-sm font-bold text-white hover:bg-brand-700">Search</button>
          {(search || visibility) && (
            <button type="button" onClick={() => { setSearch(''); setQuery(''); setVisibility(''); exams.resetPage(); }} className="min-h-11 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink">
              Reset
            </button>
          )}
        </form>
        {exams.isPending ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={4} /></div>
        ) : exams.isError ? (
          <div className="px-5 py-5"><ErrorState message="Could not load exams" onRetry={() => exams.refetch()} /></div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message={query || visibility ? 'No exams match your filters.' : 'No exams yet — add the first one for this class.'} /></div>
        ) : (
          <>
            <ul className={`divide-y divide-line transition-opacity ${exams.isFetching ? 'opacity-60' : ''}`}>
              {rows.map((exam) => (
                <li key={exam.id} className="group flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <Link to={`/dashboard/admin/exams/${classId}/${exam.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 group-hover:bg-brand-500 group-hover:text-white">
                      <FileText size={18} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-display text-base font-extrabold group-hover:text-brand-700">{exam.exam_name}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
                        <span className="inline-flex items-center gap-1"><Clock size={12} aria-hidden="true" /> {exam.minutes} mins</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1"><BookOpen size={12} aria-hidden="true" /> {exam._count?.subjects ?? 0} subjects</span>
                        <span>·</span>
                        <span>{exam._count?.questions ?? 0} questions</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1"><Users size={12} aria-hidden="true" /> {exam.students ?? 0} pupils</span>
                        <span>·</span>
                        <span>{exam._count?.results ?? 0} results</span>
                      </span>
                    </span>
                    <ChevronRight size={16} aria-hidden="true" className="ml-auto shrink-0 text-muted group-hover:text-brand-700" />
                  </Link>
                  <span className="flex shrink-0 items-center gap-2 border-t border-line pt-3 sm:border-t-0 sm:pt-0 sm:pl-4">
                    <Pill tone={exam.visible ?? true ? 'emerald' : 'amber'}>{exam.visible ?? true ? 'Visible' : 'Hidden'}</Pill>
                    <button type="button" onClick={() => toggleVisibility(exam)} aria-label={exam.visible ?? true ? `Hide ${exam.exam_name}` : `Show ${exam.exam_name}`} title="Toggle visibility" className="rounded border border-line px-3 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700">
                      {exam.visible ?? true ? <EyeOff aria-hidden="true" size={14} /> : <Eye aria-hidden="true" size={14} />}
                    </button>
                    <button type="button" onClick={() => openEdit(exam)} aria-label={`Edit ${exam.exam_name}`} title="Edit" className="rounded border border-line px-3 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700">
                      <Pencil aria-hidden="true" size={14} />
                    </button>
                    <button type="button" onClick={() => remove(exam)} aria-label={`Delete ${exam.exam_name}`} title="Delete" className="rounded border border-line px-3 py-1.5 text-xs font-bold text-rose-700 hover:border-rose-300">
                      <Trash2 aria-hidden="true" size={14} />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
            <Pagination
              total={exams.total}
              page={exams.page}
              pageCount={exams.pageCount}
              limit={exams.limit}
              onPage={exams.setPage}
              onLimit={exams.setLimit}
              disabled={exams.isFetching}
              noun="exam(s)"
            />
          </>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Exam' : 'New Exam'}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="text-sm font-semibold" htmlFor="exam-name">Exam Name</label>
            <input id="exam-name" value={form.exam_name} onChange={(e) => setForm({ ...form, exam_name: e.target.value })} placeholder="e.g. First Term Mathematics" required className={`${inputClass} text-sm`} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm font-semibold">Duration (mins)
              <input type="number" min={1} value={form.minutes} onChange={(e) => setForm({ ...form, minutes: e.target.value })} required className={inputClass} />
            </label>
            <span className="block text-sm font-semibold">Visibility
              <button type="button" role="switch" aria-checked={form.visible} onClick={() => setForm({ ...form, visible: !form.visible })} className={`mt-2 flex min-h-11 w-full items-center justify-center rounded border px-3 text-sm font-bold ${form.visible ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-line text-muted'}`}>
                {form.visible ? 'Visible' : 'Hidden'}
              </button>
            </span>
          </div>
          <p className="text-xs text-muted">This exam will belong to <b>{className}</b>.</p>
          {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="min-h-11 flex-1 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="min-h-11 flex-1 rounded bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
              {busy ? 'Saving…' : editing ? 'Save Changes' : 'Create Exam'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
