import { useState } from 'react';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pagination, Pill } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import { usePagedList } from '@/lib/pagedQuery';
import { UploadButton } from '@/lib/uploadthing';
import type { ClassItem, MaterialItem } from '@/data/dashboard';
import { Pencil } from 'lucide-react';

interface MaterialDraft {
  name: string;
  description: string;
  fileUrl: string;
  fileName: string;
  classId: string;
  editingId: string | null;
}

const EMPTY_DRAFT: MaterialDraft = { name: '', description: '', fileUrl: '', fileName: '', classId: '', editingId: null };

const formatSize = (bytes?: number | null) => {
  if (bytes === null || bytes === undefined) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const AdminMaterialsPage = () => {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [classFilter, setClassFilter] = useState('');

  const classes = useResource<ClassItem[]>('/classes');

  const files = usePagedList<MaterialItem>(
    ['admin-materials', query, classFilter],
    (page, limit) =>
      apiGet<MaterialItem[]>('/materials', {
        search: query || undefined,
        classId: classFilter && classFilter !== 'all' ? classFilter : undefined,
        audience: classFilter === 'all' ? 'all' : undefined,
        page,
        limit,
      }),
    { initialLimit: 10 },
  );

  const [draft, setDraft] = useState<MaterialDraft>(EMPTY_DRAFT);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (patch: Partial<MaterialDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) {
      setNotice('Give the material a name first.');
      return;
    }
    if (!draft.fileUrl.trim()) {
      setNotice('Upload the material file first.');
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const payload = {
        name: draft.name.trim(),
        description: draft.description.trim() || undefined,
        fileUrl: draft.fileUrl.trim(),
        fileName: draft.fileName || undefined,
        classId: draft.classId === '' ? null : draft.classId,
      };
      if (draft.editingId) {
        await apiPatch(`/materials/${draft.editingId}`, payload);
        setNotice('Changes saved.');
      } else {
        await apiPost('/materials', payload);
        setNotice('Material published — students can now download it.');
      }
      setDraft(EMPTY_DRAFT);
      files.invalidate();
    } catch (err: any) {
      setNotice(err?.message ?? 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (m: MaterialItem) => {
    setDraft({
      name: m.name,
      description: m.description ?? '',
      fileUrl: m.fileUrl,
      fileName: m.fileName ?? '',
      classId: m.classId ?? '',
      editingId: m.id,
    });
    setNotice(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setDraft(EMPTY_DRAFT);
  };

  const toggle = async (id: string, isPublished: boolean) => {
    try {
      await apiPatch(`/materials/${id}`, { isPublished: !isPublished });
      files.invalidate();
    } catch (err: any) {
      setNotice(err?.message ?? 'Update failed');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this material? Students will no longer see it.')) return;
    try {
      await apiDelete(`/materials/${id}`);
      if (draft.editingId === id) {
        setDraft(EMPTY_DRAFT);
      }
      files.invalidate();
    } catch (err: any) {
      setNotice(err?.message ?? 'Delete failed');
    }
  };

  const editing = draft.editingId !== null;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Study" title="Materials" text="Upload study packs once — every student can download them from their portal." />
      {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

      <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">{editing ? 'Edit' : 'Upload'}</p>
          <h3 className="mt-2 font-display text-lg font-extrabold">{editing ? 'Edit material' : 'New material'}</h3>
          <form className="mt-5 space-y-4" onSubmit={save}>
            <label className="block text-sm font-semibold">Name of material<input required value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. JSS 2 Mathematics — First Term pack" className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500" /></label>
            <label className="block text-sm font-semibold">Description (short excerpt)
              <textarea rows={2} value={draft.description} onChange={(e) => set({ description: e.target.value })} placeholder="One or two sentences shown under the name…" className="mt-2 w-full rounded border border-line bg-white px-3 py-3 text-sm outline-none focus:border-brand-500" />
            </label>
            <label className="block text-sm font-semibold">Class (who can download it)
              <select value={draft.classId} onChange={(e) => set({ classId: e.target.value })} className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm">
                <option value="">All classes</option>
                {(classes.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <div>
              <p className="text-sm font-semibold">Material file {draft.fileUrl && <span className="text-emerald-700">✓ uploaded{draft.fileName ? ` — ${draft.fileName}` : ''}</span>}</p>
              <div className="mt-2">
                <UploadButton endpoint="lessonMaterialUploader" label="Upload material" onClientUploadComplete={(res) => set({ fileUrl: res?.[0]?.ufsUrl ?? '', fileName: res?.[0]?.name ?? '' })} onUploadError={(err) => setNotice(err.message)} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={busy} className="min-h-11 flex-1 rounded bg-brand-900 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
                {busy ? 'Saving…' : editing ? 'Save changes' : 'Publish'}
              </button>
              {editing && (
                <button type="button" onClick={cancelEdit} className="min-h-11 rounded border border-line bg-white px-5 py-3 text-sm font-bold text-muted hover:text-ink">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </Card>

        <Card>
          <CardHead title="Published" sub={`${files.total} file(s)`} />
          <form
            className="flex flex-wrap gap-2 border-b border-line px-5 py-4"
            onSubmit={(e) => {
              e.preventDefault();
              setQuery(search);
              files.resetPage();
            }}
          >
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or description…"
              aria-label="Search materials"
              className="min-h-11 w-full max-w-xs rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500"
            />
            <select value={classFilter} onChange={(e) => { setClassFilter(e.target.value); files.resetPage(); }} aria-label="Filter by class" className="min-h-11 rounded border border-line bg-white px-3 text-sm font-semibold">
              <option value="">All materials</option>
              <option value="all">For all classes</option>
              {(classes.data ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <button type="submit" className="min-h-11 rounded bg-brand-900 px-4 text-sm font-bold text-white hover:bg-brand-700">Search</button>
            {(search || classFilter) && (
              <button type="button" onClick={() => { setSearch(''); setQuery(''); setClassFilter(''); files.resetPage(); }} className="min-h-11 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink">
                Reset
              </button>
            )}
          </form>
          {files.isPending ? (
            <div className="px-5 py-5"><LoadingSkeleton rows={4} /></div>
          ) : files.isError ? (
            <div className="px-5 py-5"><ErrorState message="Could not load materials" onRetry={() => files.refetch()} /></div>
          ) : files.rows.length === 0 ? (
            <div className="px-5 py-5"><EmptyState message={query || classFilter ? 'No materials match your filters.' : 'No materials yet. Upload the first one.'} /></div>
          ) : (
            <>
              <ul className={`divide-y divide-line transition-opacity ${files.isFetching ? 'opacity-60' : ''}`}>
                {files.rows.map((m) => (
                  <li key={m.id} className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Pill tone={m.class ? 'emerald' : 'violet'}>{m.class?.name ?? 'All classes'}</Pill>
                      {m.fileName && <Pill tone="sky">{m.fileName.split('.').pop()?.toUpperCase() ?? 'FILE'}</Pill>}
                      {m.sizeBytes ? <span className="text-xs text-muted">{formatSize(m.sizeBytes)}</span> : null}
                      <span className="text-xs text-muted">{new Date(m.createdAt).toLocaleDateString()}</span>
                      {!m.isPublished && <Pill tone="amber">Hidden</Pill>}
                    </div>
                    <h4 className="mt-2 font-display text-sm font-extrabold">{m.name}</h4>
                    {m.description && <p className="mt-1 text-sm text-muted">{m.description}</p>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <a href={m.fileUrl} target="_blank" rel="noreferrer" download className="inline-flex items-center rounded border border-line px-3 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700">Download</a>
                      <button type="button" onClick={() => startEdit(m)} className="inline-flex items-center rounded border border-line px-3 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700"><Pencil aria-hidden="true" size={14} className="mr-1" /> Edit</button>
                      <button type="button" onClick={() => toggle(m.id, m.isPublished)} className="rounded border border-line px-3 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700">{m.isPublished ? 'Hide' : 'Show'}</button>
                      <button type="button" onClick={() => remove(m.id)} className="rounded border border-line px-3 py-1.5 text-xs font-bold text-rose-700 hover:border-rose-300">Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
              <Pagination
                total={files.total}
                page={files.page}
                pageCount={files.pageCount}
                limit={files.limit}
                onPage={files.setPage}
                onLimit={files.setLimit}
                disabled={files.isFetching}
                noun="file(s)"
              />
            </>
          )}
        </Card>
      </div>
    </div>
  );
};
