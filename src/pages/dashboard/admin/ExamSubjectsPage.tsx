import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, Modal, PageHeader } from '@/components/dashboard/DashboardUI';
import { useAuth, useResource } from '@/context/AuthContext';
import { apiDelete, apiPost, apiPut } from '@/lib/api';
import { ROUTES } from '@/routes/paths';
import { BookOpen, ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react';

interface SubjectItem {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  classes?: Array<{ id: string; name: string }>;
}

interface ExamInfo {
  id: string;
  exam_name: string;
}

const inputClass = 'mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500';

export const ExamSubjectsPage = () => {
  const { classId = '', examId = '' } = useParams<{ classId: string; examId: string }>();
  const { user } = useAuth();
  const exam = useResource<ExamInfo>(examId ? `/exams/${examId}` : null);
  const { data, loading, error, reload } = useResource<SubjectItem[]>('/subjects');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SubjectItem | null>(null);
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Only subjects linked to this class — mirrors the EXAMPLE linkage rule.
  const linked = (data ?? []).filter((s) => (s.classes ?? []).some((c) => c.id === classId));
  const list = linked.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.code ?? '').toLowerCase().includes(search.toLowerCase()),
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', code: '', description: '' });
    setNotice(null);
    setModalOpen(true);
  };

  const openEdit = (subject: SubjectItem) => {
    setEditing(subject);
    setForm({ name: subject.name, code: subject.code ?? '', description: subject.description ?? '' });
    setNotice(null);
    setModalOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setNotice('Enter a subject name.');
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const payload = {
        name: form.name.trim(),
        code: form.code.trim() || undefined,
        description: form.description.trim() || undefined,
        workspaceId: user?.workspaceId,
        classIds: [classId],
      };
      if (editing) {
        await apiPut(`/subjects/${editing.id}`, payload);
        setNotice(`Subject "${form.name.trim()}" updated.`);
      } else {
        await apiPost('/subjects', payload);
        setNotice(`Subject "${form.name.trim()}" created under this exam's class.`);
      }
      setModalOpen(false);
      setEditing(null);
      reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (subject: SubjectItem) => {
    if (!confirm(`Delete subject "${subject.name}"? Its questions are removed too. This cannot be undone.`)) return;
    try {
      await apiDelete(`/subjects/${subject.id}`);
      setNotice(`Subject "${subject.name}" deleted.`);
      reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Delete failed');
    }
  };

  const examName = exam.data?.exam_name ?? 'Exam';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={`Exam & Test · ${examName}`}
        title={`Subjects — ${examName}`}
        text="Subjects linked to this class. Select a subject to manage its questions."
        actions={
          <button type="button" onClick={openCreate} className="inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
            <Plus aria-hidden="true" size={16} className="mr-2" /> Add New Subject
          </button>
        }
      />
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link to={ROUTES.adminExams} className="font-bold text-brand-700 hover:text-brand-500">Classes</Link>
        <span className="px-2">/</span>
        <Link to={`/dashboard/admin/exams/${classId}`} className="font-bold text-brand-700 hover:text-brand-500">{examName === 'Exam' ? 'Exams' : examName}</Link>
        <span className="px-2">/</span>
        <span className="text-ink" aria-current="page">Subjects</span>
      </nav>
      {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

      <Card>
        <CardHead title="Subjects in this class" sub={`${list.length} shown`} />
        <div className="border-b border-line px-5 py-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by subject name or code…"
            aria-label="Search subjects"
            className="min-h-11 w-full max-w-sm rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        {loading ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={4} /></div>
        ) : error || !data ? (
          <div className="px-5 py-5"><ErrorState message={error ?? 'No data'} onRetry={reload} /></div>
        ) : list.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message={search ? 'No subjects match your search.' : 'No subjects linked to this class yet — add the first one.'} /></div>
        ) : (
          <ul className="divide-y divide-line">
            {list.map((subject) => (
              <li key={subject.id} className="group flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <Link to={`/dashboard/admin/exams/${classId}/${examId}/${subject.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700 group-hover:bg-brand-500 group-hover:text-white">
                    <BookOpen size={18} aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-display text-base font-extrabold group-hover:text-brand-700">
                      {subject.name}
                      {subject.code && <span className="ml-2 text-xs font-bold text-muted">{subject.code}</span>}
                    </span>
                    {subject.description && <span className="block truncate text-xs text-muted">{subject.description}</span>}
                  </span>
                  <ChevronRight size={16} aria-hidden="true" className="ml-auto shrink-0 text-muted group-hover:text-brand-700" />
                </Link>
                <span className="flex shrink-0 gap-2 border-t border-line pt-3 sm:border-t-0 sm:pt-0 sm:pl-4">
                  <button type="button" onClick={() => openEdit(subject)} aria-label={`Edit ${subject.name}`} title="Edit" className="rounded border border-line px-3 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700">
                    <Pencil aria-hidden="true" size={14} />
                  </button>
                  <button type="button" onClick={() => remove(subject)} aria-label={`Delete ${subject.name}`} title="Delete" className="rounded border border-line px-3 py-1.5 text-xs font-bold text-rose-700 hover:border-rose-300">
                    <Trash2 aria-hidden="true" size={14} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Subject' : 'New Subject'}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="text-sm font-semibold" htmlFor="subject-name">Subject Name</label>
            <input id="subject-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Mathematics" required className={`${inputClass} text-sm`} />
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="subject-code">Code (optional)</label>
            <input id="subject-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. MTH101" className={`${inputClass} text-sm`} />
          </div>
          <div>
            <label className="text-sm font-semibold" htmlFor="subject-description">Description (optional)</label>
            <textarea id="subject-description" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does this subject cover?" className="mt-2 w-full rounded border border-line bg-white px-3 py-3 text-sm outline-none focus:border-brand-500" />
          </div>
          {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="min-h-11 flex-1 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="min-h-11 flex-1 rounded bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
              {busy ? 'Saving…' : editing ? 'Save Changes' : 'Create Subject'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
