import { Suspense, lazy, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pill } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { apiDelete, apiPatch, apiPost } from '@/lib/api';
import { UploadButton } from '@/lib/uploadthing';
import { ROUTES } from '@/routes/paths';
import type { NoticeData } from '@/data/dashboard';
import { Eye, Pencil } from 'lucide-react';

// Code-split: the heavy editor ships only in the admin bundle.
const NewsEditor = lazy(() => import('@/lib/mdxEditor').then((m) => ({ default: m.NewsEditor })));

const DRAFT_KEY = 'lwu_news_draft';

interface ComposeDraft {
  title: string;
  category: string;
  description: string;
  body: string;
  coverUrl: string;
  editingId: string | null;
}

const EMPTY_DRAFT: ComposeDraft = { title: '', category: 'Announcement', description: '', body: '', coverUrl: '', editingId: null };

const readSavedDraft = (): ComposeDraft => {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return EMPTY_DRAFT;
    return { ...EMPTY_DRAFT, ...(JSON.parse(raw) as Partial<ComposeDraft>) };
  } catch {
    return EMPTY_DRAFT;
  }
};

export const AdminNewsPage = () => {
  const navigate = useNavigate();
  const { data, loading, error, reload } = useResource<NoticeData[]>('/notices');
  const [draft, setDraft] = useState<ComposeDraft>(readSavedDraft);
  const [editorKey, setEditorKey] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (patch: Partial<ComposeDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const persist = (d: ComposeDraft) => {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    } catch {
      /* private mode — preview still works via route state */
    }
  };
  const clearPersisted = () => {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {
      /* ignore */
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.body.trim()) {
      setNotice('Write the announcement content first.');
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const payload = {
        title: draft.title,
        category: draft.category,
        description: draft.description || undefined,
        body: draft.body,
        coverUrl: draft.coverUrl || undefined,
      };
      if (draft.editingId) {
        await apiPatch(`/notices/${draft.editingId}`, payload);
        setNotice('Changes saved.');
      } else {
        await apiPost('/notices', payload);
        setNotice('Published to the News page.');
      }
      setDraft(EMPTY_DRAFT);
      clearPersisted();
      setEditorKey((k) => k + 1); // remount editor (markdown is initial-only)
      reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (post: NoticeData) => {
    const next: ComposeDraft = {
      title: post.title,
      category: post.category,
      description: post.description ?? '',
      body: post.body,
      coverUrl: post.coverUrl ?? '',
      editingId: post.id,
    };
    setDraft(next);
    persist(next);
    setEditorKey((k) => k + 1);
    setNotice(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setDraft(EMPTY_DRAFT);
    clearPersisted();
    setEditorKey((k) => k + 1);
  };

  const previewDraft = () => {
    persist(draft);
    navigate(ROUTES.adminNewsPreview, {
      state: { draft: { title: draft.title, description: draft.description, body: draft.body, category: draft.category, coverUrl: draft.coverUrl } },
    });
  };

  const previewExisting = (id: string) => {
    navigate(ROUTES.adminNewsPreview, { state: { id } });
  };

  const toggle = async (id: string, isPublished: boolean) => {
    try {
      await apiPatch(`/notices/${id}`, { isPublished: !isPublished });
      reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Update failed');
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    try {
      await apiDelete(`/notices/${id}`);
      if (draft.editingId === id) {
        setDraft(EMPTY_DRAFT);
        clearPersisted();
        setEditorKey((k) => k + 1);
      }
      reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Delete failed');
    }
  };

  const editing = draft.editingId !== null;

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Communications" title="News & events" text="Published announcements appear on the public News page. Hidden ones disappear everywhere." />
      {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

      <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">{editing ? 'Edit' : 'Compose'}</p>
          <h3 className="mt-2 font-display text-lg font-extrabold">{editing ? 'Edit announcement' : 'New announcement'}</h3>
          <form className="mt-5 space-y-4" onSubmit={save}>
            <label className="block text-sm font-semibold">Title<input required value={draft.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Open day — 15 Nov" className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500" /></label>
            <label className="block text-sm font-semibold">Category
              <select value={draft.category} onChange={(e) => set({ category: e.target.value })} className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm"><option>Announcement</option><option>Academic</option><option>Sports</option><option>Cultural</option><option>Events</option></select>
            </label>
            <label className="block text-sm font-semibold">Description (short excerpt)
              <textarea rows={2} value={draft.description} onChange={(e) => set({ description: e.target.value })} placeholder="One or two sentences shown on cards and under the title…" className="mt-2 w-full rounded border border-line bg-white px-3 py-3 text-sm outline-none focus:border-brand-500" />
            </label>
            <div>
              <p className="text-sm font-semibold">Content</p>
              <div className="mt-2">
                <Suspense fallback={<LoadingSkeleton rows={3} />}>
                  <NewsEditor key={editorKey} initialValue={draft.body} onChange={(md) => set({ body: md })} />
                </Suspense>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold">Cover image {draft.coverUrl && <span className="text-emerald-700">✓ uploaded</span>}</p>
              <div className="mt-2">
                <UploadButton endpoint="avatarUploader" onClientUploadComplete={(res) => set({ coverUrl: res?.[0]?.ufsUrl ?? '' })} onUploadError={(err) => setNotice(err.message)} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={busy} className="min-h-11 flex-1 rounded bg-brand-900 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
                {busy ? 'Saving…' : editing ? 'Save changes' : 'Publish'}
              </button>
              <button type="button" onClick={previewDraft} className="inline-flex min-h-11 items-center rounded border border-line bg-white px-5 py-3 text-sm font-bold text-ink hover:border-brand-500 hover:text-brand-700">
                <Eye aria-hidden="true" size={16} className="mr-2" /> Preview
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
          <CardHead title="Published" sub={`${data?.length ?? 0} post(s)`} />
          {loading ? (
            <div className="px-5 py-5"><LoadingSkeleton rows={4} /></div>
          ) : error || !data ? (
            <div className="px-5 py-5"><ErrorState message={error ?? 'No data'} onRetry={reload} /></div>
          ) : data.length === 0 ? (
            <div className="px-5 py-5"><EmptyState message="No posts yet." /></div>
          ) : (
            <ul className="divide-y divide-line">
              {data.map((n) => (
                <li key={n.id} className="px-5 py-4">
                  <div className="flex items-center gap-2"><Pill tone="sky">{n.category}</Pill><span className="text-xs text-muted">{new Date(n.createdAt).toLocaleDateString()}</span>{!n.isPublished && <Pill tone="amber">Hidden</Pill>}</div>
                  <h4 className="mt-2 font-display text-sm font-extrabold">{n.title}</h4>
                  {n.description && <p className="mt-1 text-sm text-muted">{n.description}</p>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => previewExisting(n.id)} className="inline-flex items-center rounded border border-line px-3 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700"><Eye aria-hidden="true" size={14} className="mr-1" /> Preview</button>
                    <button type="button" onClick={() => startEdit(n)} className="inline-flex items-center rounded border border-line px-3 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700"><Pencil aria-hidden="true" size={14} className="mr-1" /> Edit</button>
                    <button type="button" onClick={() => toggle(n.id, n.isPublished)} className="rounded border border-line px-3 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700">{n.isPublished ? 'Hide' : 'Show'}</button>
                    <button type="button" onClick={() => remove(n.id)} className="rounded border border-line px-3 py-1.5 text-xs font-bold text-rose-700 hover:border-rose-300">Delete</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
};
