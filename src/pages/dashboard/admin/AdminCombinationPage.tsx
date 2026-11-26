import { useState } from 'react';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, Modal, PageHeader, Pill } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { apiDelete, apiPatch, apiPost } from '@/lib/api';
import type { CombinationItem, SubjectItem } from '@/data/dashboard';
import { Pencil, Plus, Trash2 } from 'lucide-react';

export const AdminCombinationPage = () => {
  const { data, loading, error, reload } = useResource<CombinationItem[]>('/combinations', { limit: 100 });
  const subjects = useResource<SubjectItem[]>('/subjects', { limit: 200 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CombinationItem | null>(null);
  const [name, setName] = useState('');
  const [picked, setPicked] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setName('');
    setPicked([]);
    setNotice(null);
    setModalOpen(true);
  };

  const openEdit = (c: CombinationItem) => {
    setEditing(c);
    setName(c.name);
    setPicked(c.subjects.map((s) => s.subject.id));
    setNotice(null);
    setModalOpen(true);
  };

  const toggleSubject = (id: string) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNotice('Give the combination a name (e.g. SCIENCE).');
      return;
    }
    if (!picked.length) {
      setNotice('Pick at least one subject (e.g. MATH, Phy, Chem).');
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      if (editing) {
        await apiPatch(`/combinations/${editing.id}`, { name: name.trim(), subjectIds: picked });
        setNotice(`Combination "${name.trim()}" updated.`);
      } else {
        await apiPost('/combinations', { name: name.trim(), subjectIds: picked });
        setNotice(`Combination "${name.trim()}" created.`);
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

  const remove = async (c: CombinationItem) => {
    if (!confirm(`Delete combination "${c.name}"? Pupils linked to it keep their accounts but lose the grouping.`)) return;
    try {
      await apiDelete(`/combinations/${c.id}`);
      reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Exam & Test"
        title="Combinations"
        text="Subject groupings pupils enrol into — e.g. SCIENCE → MATH, Phy, Chem."
        actions={
          <button type="button" onClick={openCreate} className="inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
            <Plus aria-hidden="true" size={16} className="mr-2" /> New Combination
          </button>
        }
      />
      {notice && !modalOpen && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

      <Card>
        <CardHead title="All combinations" sub={`${data?.length ?? 0} total`} />
        {loading ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={4} /></div>
        ) : error || !data ? (
          <div className="px-5 py-5"><ErrorState message={error ?? 'No data'} onRetry={reload} /></div>
        ) : data.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message="No combinations yet — create the first one." /></div>
        ) : (
          <ul className="divide-y divide-line">
            {data.map((c) => (
              <li key={c.id} className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-display text-base font-extrabold">{c.name}</p>
                  <p className="mt-1 flex flex-wrap gap-1.5">
                    {c.subjects.length === 0 ? (
                      <span className="text-xs text-muted">No subjects linked</span>
                    ) : (
                      c.subjects.map((s) => <Pill key={s.subject.id} tone="sky">{s.subject.name}</Pill>)
                    )}
                  </p>
                  <p className="mt-1 text-xs text-muted">{c._count?.students ?? 0} pupil(s) enrolled</p>
                </div>
                <span className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => openEdit(c)} aria-label={`Edit ${c.name}`} title="Edit" className="rounded border border-line px-3 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700">
                    <Pencil aria-hidden="true" size={14} />
                  </button>
                  <button type="button" onClick={() => remove(c)} aria-label={`Delete ${c.name}`} title="Delete" className="rounded border border-line px-3 py-1.5 text-xs font-bold text-rose-700 hover:border-rose-300">
                    <Trash2 aria-hidden="true" size={14} />
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Combination' : 'New Combination'}>
        <form onSubmit={save} className="space-y-4">
          <label className="block text-sm font-semibold">Name
            <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. SCIENCE" className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm uppercase outline-none focus:border-brand-500" />
          </label>
          <div>
            <p className="text-sm font-semibold">Subjects <span className="font-normal text-muted">({picked.length} picked)</span></p>
            <div className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded border border-line p-2">
              {(subjects.data ?? []).map((s) => (
                <label key={s.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm hover:bg-brand-50">
                  <input
                    type="checkbox"
                    checked={picked.includes(s.id)}
                    onChange={() => toggleSubject(s.id)}
                    className="h-4 w-4 rounded accent-brand-700"
                  />
                  <span className="font-semibold">{s.name}</span>
                  {s.code && <span className="text-xs text-muted">{s.code}</span>}
                </label>
              ))}
              {(subjects.data ?? []).length === 0 && <p className="px-2 py-3 text-xs text-muted">No subjects yet — create subjects first.</p>}
            </div>
          </div>
          {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="min-h-11 flex-1 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink">
              Cancel
            </button>
            <button type="submit" disabled={busy} className="min-h-11 flex-1 rounded bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
              {busy ? 'Saving…' : editing ? 'Save Changes' : 'Create Combination'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
