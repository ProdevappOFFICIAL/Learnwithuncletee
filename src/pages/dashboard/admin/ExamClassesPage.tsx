import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, Modal, PageHeader } from '@/components/dashboard/DashboardUI';
import { useAuth, useResource } from '@/context/AuthContext';
import { apiDelete, apiPost, apiPut } from '@/lib/api';
import { ChevronRight, GraduationCap, Pencil, Plus, Trash2 } from 'lucide-react';

interface ClassItem {
  id: string;
  name: string;
  _count?: { exams?: number; subjects?: number; students?: number };
}

const inputClass = 'mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500';

export const ExamClassesPage = () => {
  const { user } = useAuth();
  const { data, loading, error, reload } = useResource<ClassItem[]>('/classes');
  const [search, setSearch] = useState('');
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
      reload();
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
      reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Delete failed');
    }
  };

  const list = (data ?? []).filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Exam & Test"
        title="Classes"
        text="Select a class to manage its exams, subjects and questions."
        actions={
          <button type="button" onClick={openCreate} className="inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
            <Plus aria-hidden="true" size={16} className="mr-2" /> Add New Class
          </button>
        }
      />
      {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

      <Card>
        <CardHead title="All classes" sub={`${list.length} shown`} />
        <div className="border-b border-line px-5 py-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by class name…"
            aria-label="Search classes"
            className="min-h-11 w-full max-w-sm rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500"
          />
        </div>
        {loading ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={4} /></div>
        ) : error || !data ? (
          <div className="px-5 py-5"><ErrorState message={error ?? 'No data'} onRetry={reload} /></div>
        ) : list.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message={search ? 'No classes match your search.' : 'No classes yet — create the first one.'} /></div>
        ) : (
          <ul className="divide-y divide-line">
            {list.map((cls) => (
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
