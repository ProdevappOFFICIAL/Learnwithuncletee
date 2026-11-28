import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Image as ImageIcon,
  LoaderCircle,
  Plus,
  RotateCcw,
  Save,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { Card, PageHeader, Pill } from '@/components/dashboard/DashboardUI';
import { UploadButton } from '@/lib/uploadthing';
import { useToast } from '@/components/ui/Toast';
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api';
import { SITE_PAGES, mergeSiteContent, siteDefaults, type SitePageKey } from '@/site/defaults';
import { getSitePath, setSitePath } from '@/site/SiteContent';

type SelectedEdit = { path: string; kind: 'text' | 'image' | 'link'; value: any };

const emptyLike = (value: any): any => {
  if (Array.isArray(value)) return [];
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, child]) => [
        key,
        key === 'id' ? crypto.randomUUID() : emptyLike(child),
      ]),
    );
  }
  return '';
};

const labelForPath = (path: string) => {
  const parts = path.split('.');
  return parts
    .slice(-2)
    .join(' · ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ');
};

const SiteTestimonialsManager = ({
  onClose,
  onChanged,
}: {
  onClose: () => void;
  onChanged: () => void;
}) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const rows = useQuery({
    queryKey: ['site-admin-testimonials'],
    queryFn: async () => (await apiGet<any[]>('/site-content/admin/testimonials')).data,
  });
  const [form, setForm] = useState({ name: '', role: '', quote: '', photoUrl: '', rating: 5, published: true });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setEditingId(null);
    setForm({ name: '', role: '', quote: '', photoUrl: '', rating: 5, published: true });
  };

  const save = async () => {
    if (!form.name.trim() || !form.quote.trim()) {
      toast.error('Add the person’s name and testimonial quote.');
      return;
    }
    setBusy(true);
    try {
      if (editingId) await apiPut(`/site-content/admin/testimonials/${editingId}`, form);
      else await apiPost('/site-content/admin/testimonials', form);
      await queryClient.invalidateQueries({ queryKey: ['site-admin-testimonials'] });
      toast.success(editingId ? 'Testimonial updated.' : 'Testimonial added.');
      reset();
      onChanged();
    } catch (error: any) {
      toast.error(error?.message ?? 'Could not save the testimonial.');
    } finally {
      setBusy(false);
    }
  };

  const edit = (row: any) => {
    setEditingId(row.id);
    setForm({
      name: row.name ?? '',
      role: row.role ?? '',
      quote: row.quote ?? '',
      photoUrl: row.photoUrl ?? '',
      rating: row.rating ?? 5,
      published: row.published !== false,
    });
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this testimonial?')) return;
    try {
      await apiDelete(`/site-content/admin/testimonials/${id}`);
      await queryClient.invalidateQueries({ queryKey: ['site-admin-testimonials'] });
      onChanged();
      toast.success('Testimonial deleted.');
    } catch (error: any) {
      toast.error(error?.message ?? 'Could not delete the testimonial.');
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-brand-900/60 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-brand-700">Home page</p>
            <h2 className="font-display text-lg font-extrabold">Testimonials</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded border border-line hover:bg-cream"><X size={18} /></button>
        </div>
        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-5 lg:grid-cols-2">
          <div className="space-y-3">
            {(rows.data ?? []).map((row) => (
              <article key={row.id} className="rounded border border-line p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold">{row.name}</p>
                    <p className="text-xs text-muted">{row.role || 'Community member'}</p>
                  </div>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => edit(row)} className="rounded border border-line px-2 py-1 text-[10px] font-bold hover:border-brand-400">Edit</button>
                    <button type="button" onClick={() => void remove(row.id)} className="rounded border border-line px-2 py-1 text-[10px] font-bold text-rose-700 hover:border-rose-300">Delete</button>
                  </div>
                </div>
                <p className="mt-2 text-xs italic text-muted">“{row.quote}”</p>
              </article>
            ))}
            {rows.isPending && <p className="text-sm text-muted">Loading…</p>}
            {!rows.isPending && !(rows.data ?? []).length && <p className="text-sm text-muted">No testimonials yet. Add the first one.</p>}
          </div>
          <div className="space-y-3 rounded border border-line bg-cream/50 p-4">
            <p className="text-sm font-extrabold">{editingId ? 'Edit testimonial' : 'Add testimonial'}</p>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="min-h-10 w-full rounded border border-line bg-white px-3 text-sm" />
            <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="Role (Parent, Student, Educator…)" className="min-h-10 w-full rounded border border-line bg-white px-3 text-sm" />
            <textarea value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} rows={4} placeholder="Testimonial quote" className="w-full rounded border border-line bg-white px-3 py-2 text-sm" />
            <input value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} placeholder="Photo URL (optional)" className="min-h-10 w-full rounded border border-line bg-white px-3 text-sm" />
            <label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="h-4 w-4 accent-brand-500" /> Show on the public site</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => void save()} disabled={busy} className="min-h-10 flex-1 rounded bg-brand-500 px-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">{busy ? 'Saving…' : editingId ? 'Save' : 'Add testimonial'}</button>
              {editingId && <button type="button" onClick={reset} className="min-h-10 rounded border border-line px-3 text-sm font-bold text-muted">Cancel</button>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SiteGalleryManager = ({ onClose, onChanged }: { onClose: () => void; onChanged: () => void }) => {
  const queryClient = useQueryClient();
  const toast = useToast();
  const rows = useQuery({
    queryKey: ['site-admin-gallery'],
    queryFn: async () => (await apiGet<any[]>('/site-content/admin/gallery')).data,
  });
  const [form, setForm] = useState({ url: '', caption: '', category: 'Campus', published: true });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!form.url.trim()) {
      toast.error('Upload an image or paste an image URL.');
      return;
    }
    setBusy(true);
    try {
      if (editingId) await apiPut(`/site-content/admin/gallery/${editingId}`, form);
      else await apiPost('/site-content/admin/gallery', form);
      await queryClient.invalidateQueries({ queryKey: ['site-admin-gallery'] });
      setForm({ url: '', caption: '', category: 'Campus', published: true });
      setEditingId(null);
      onChanged();
      toast.success(editingId ? 'Gallery image updated.' : 'Gallery image added.');
    } catch (error: any) {
      toast.error(error?.message ?? 'Could not save the gallery image.');
    } finally {
      setBusy(false);
    }
  };

  const edit = (row: any) => {
    setEditingId(row.id);
    setForm({ url: row.url ?? '', caption: row.caption ?? '', category: row.category ?? 'Campus', published: row.published !== false });
  };

  const remove = async (id: string) => {
    if (!window.confirm('Delete this gallery image?')) return;
    try {
      await apiDelete(`/site-content/admin/gallery/${id}`);
      await queryClient.invalidateQueries({ queryKey: ['site-admin-gallery'] });
      onChanged();
      toast.success('Gallery image deleted.');
    } catch (error: any) {
      toast.error(error?.message ?? 'Could not delete the gallery image.');
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-brand-900/60 p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.18em] text-brand-700">Gallery page</p>
            <h2 className="font-display text-lg font-extrabold">Photos</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded border border-line hover:bg-cream"><X size={18} /></button>
        </div>
        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-5 lg:grid-cols-[1.2fr_.8fr]">
          <div className="grid grid-cols-2 gap-3">
            {(rows.data ?? []).map((row) => (
              <article key={row.id} className="overflow-hidden rounded border border-line">
                <img src={row.url} alt={row.caption ?? ''} className="aspect-[4/3] w-full object-cover" />
                <div className="p-2">
                  <p className="text-xs font-bold">{row.category}</p>
                  <p className="truncate text-[11px] text-muted">{row.caption}</p>
                  <div className="mt-2 flex gap-1">
                    <button type="button" onClick={() => edit(row)} className="rounded border border-line px-2 py-1 text-[10px] font-bold">Edit</button>
                    <button type="button" onClick={() => void remove(row.id)} className="rounded border border-line px-2 py-1 text-[10px] font-bold text-rose-700">Delete</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="space-y-3 rounded border border-line bg-cream/50 p-4">
            <p className="text-sm font-extrabold">{editingId ? 'Edit photo' : 'Add photo'}</p>
            {form.url && <img src={form.url} alt="" className="h-36 w-full rounded border border-line object-cover" />}
            <UploadButton endpoint="galleryUploader" label="Upload image" onClientUploadComplete={(res) => setForm((previous) => ({ ...previous, url: res?.[0]?.ufsUrl ?? previous.url }))} onUploadError={(error) => toast.error(error.message)} />
            <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="Image URL" className="min-h-10 w-full rounded border border-line bg-white px-3 text-sm" />
            <input value={form.caption} onChange={(e) => setForm({ ...form, caption: e.target.value })} placeholder="Caption" className="min-h-10 w-full rounded border border-line bg-white px-3 text-sm" />
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="min-h-10 w-full rounded border border-line bg-white px-3 text-sm">
              {['Campus', 'Academics', 'Students', 'Sports', 'Cultural', 'Events', 'Staff'].map((category) => <option key={category}>{category}</option>)}
            </select>
            <label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} className="h-4 w-4 accent-brand-500" /> Show on the public site</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => void save()} disabled={busy} className="min-h-10 flex-1 rounded bg-brand-500 px-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">{busy ? 'Saving…' : editingId ? 'Save' : 'Add photo'}</button>
              {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ url: '', caption: '', category: 'Campus', published: true }); }} className="min-h-10 rounded border border-line px-3 text-sm font-bold text-muted">Cancel</button>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const AdminCustomizationPage = () => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const [pageKey, setPageKey] = useState<SitePageKey>('home');
  const [override, setOverride] = useState<any>({});
  const [publishedOverride, setPublishedOverride] = useState<any>({});
  const [selected, setSelected] = useState<SelectedEdit | null>(null);
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'phone'>('desktop');
  const [saveState, setSaveState] = useState<'saved' | 'saving' | 'dirty' | 'error'>('saved');
  const [busy, setBusy] = useState(false);
  const [testimonialsOpen, setTestimonialsOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const saveTimer = useRef<number | undefined>(undefined);
  const overrideRef = useRef<any>({});

  const pageQuery = useQuery({
    queryKey: ['site-admin-page', pageKey],
    queryFn: async () => (await apiGet<any>(`/site-content/admin/pages/${pageKey}`)).data,
    staleTime: 0,
  });

  useEffect(() => {
    const data = pageQuery.data;
    if (!data || data.pageKey !== pageKey) return;
    const next = mergeSiteContent(siteDefaults[pageKey] ?? {}, data.draft ?? {});
    setOverride(next);
    overrideRef.current = next;
    setPublishedOverride(mergeSiteContent(siteDefaults[pageKey] ?? {}, data.published ?? {}));
    setSelected(null);
    setSaveState('saved');
  }, [pageQuery.data, pageKey]);

  useEffect(() => {
    // Clear the previous page's draft while the new admin page loads.
    setOverride({});
    overrideRef.current = {};
    setSelected(null);
  }, [pageKey]);

  useEffect(() => {
    overrideRef.current = override;
  }, [override]);

  const defaults = siteDefaults[pageKey] ?? {};
  const merged = useMemo(() => mergeSiteContent(defaults, override), [defaults, override]);
  const selectedValue = selected ? getSitePath(merged, selected.path) : undefined;

  const postDraft = (next: any) => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: 'site-draft', pageKey, content: next },
      window.location.origin,
    );
  };

  useEffect(() => {
    postDraft(override);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [override, pageKey]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (data?.type === 'site-preview-ready' && data.pageKey === pageKey) {
        postDraft(overrideRef.current);
      }
      if (data?.type === 'site-edit' && data.pageKey === pageKey) {
        setSelected({ path: data.path, kind: data.kind, value: data.value });
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageKey]);

  const persist = async (next: any) => {
    setSaveState('saving');
    try {
      await apiPut(`/site-content/admin/pages/${pageKey}`, { content: next });
      setSaveState('saved');
    } catch (error: any) {
      setSaveState('error');
      toast.error(error?.message ?? 'Could not save the draft.');
    }
  };

  const scheduleSave = (next: any) => {
    setSaveState('dirty');
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => void persist(next), 900);
  };

  const applyPath = (path: string, value: any) => {
    const next = setSitePath(overrideRef.current ?? {}, path, value);
    overrideRef.current = next;
    setOverride(next);
    scheduleSave(next);
    setSelected((previous) => (previous ? { ...previous, value } : previous));
  };

  const parentArray = (() => {
    if (!selected) return null;
    const match = /^(.*)\.(\d+)(?:\.|$)/.exec(selected.path);
    if (!match) return null;
    const arrayPath = match[1];
    const index = Number(match[2]);
    const array = getSitePath(merged, arrayPath);
    return Array.isArray(array) ? { arrayPath, index, array } : null;
  })();

  const applyArray = (arrayPath: string, nextArray: any[]) => {
    applyPath(arrayPath, nextArray);
  };

  const addItem = () => {
    if (!parentArray) return;
    const template = parentArray.array[parentArray.index];
    const blank = template && typeof template === 'object' ? emptyLike(template) : '';
    const next = [...parentArray.array];
    next.splice(parentArray.index + 1, 0, blank);
    applyArray(parentArray.arrayPath, next);
    setSelected({ path: `${parentArray.arrayPath}.${parentArray.index + 1}`, kind: 'text', value: '' });
  };

  const removeItem = () => {
    if (!parentArray) return;
    const next = parentArray.array.filter((_, index) => index !== parentArray.index);
    applyArray(parentArray.arrayPath, next);
    setSelected(null);
  };

  const moveItem = (direction: -1 | 1) => {
    if (!parentArray) return;
    const target = parentArray.index + direction;
    if (target < 0 || target >= parentArray.array.length) return;
    const next = [...parentArray.array];
    [next[parentArray.index], next[target]] = [next[target], next[parentArray.index]];
    applyArray(parentArray.arrayPath, next);
    setSelected({ ...selected!, path: `${parentArray.arrayPath}.${target}`, value: next[target] });
  };

  const publish = async () => {
    setBusy(true);
    try {
      await apiPut(`/site-content/admin/pages/${pageKey}`, { content: overrideRef.current });
      await apiPost(`/site-content/admin/pages/${pageKey}/publish`);
      setPublishedOverride(overrideRef.current);
      await queryClient.invalidateQueries({ queryKey: ['site-content'] });
      await queryClient.invalidateQueries({ queryKey: ['site-testimonials'] });
      await queryClient.invalidateQueries({ queryKey: ['site-gallery'] });
      toast.success('Page published. The public site now shows these changes.');
    } catch (error: any) {
      toast.error(error?.message ?? 'Could not publish this page.');
    } finally {
      setBusy(false);
    }
  };

  const resetDraft = async () => {
    if (!window.confirm('Discard this draft and restore the published version?')) return;
    try {
      await apiPost(`/site-content/admin/pages/${pageKey}/reset`);
      const next = publishedOverride ?? {};
      setOverride(next);
      overrideRef.current = next;
      postDraft(next);
      setSelected(null);
      setSaveState('saved');
      toast.success('Draft reset to the published version.');
    } catch (error: any) {
      toast.error(error?.message ?? 'Could not reset the draft.');
    }
  };

  const reloadPreview = () => {
    if (iframeRef.current) iframeRef.current.src = `/site-preview/${pageKey}?t=${Date.now()}`;
  };

  const pageLabel = SITE_PAGES.find((page) => page.key === pageKey)?.label ?? 'Page';
  const widths = { desktop: '100%', tablet: '820px', phone: '390px' };

  const renderEditor = () => {
    if (!selected) {
      return (
        <div className="space-y-3 text-sm text-muted">
          <p className="font-semibold text-ink">Click any text or image in the preview to edit it.</p>
          <p>Changes are saved as a draft. Publish when you are ready for them to appear on the public website.</p>
          <ul className="list-disc space-y-1 pl-5 text-xs">
            <li>Use the arrows on a selected item to reorder it.</li>
            <li>Use “Add item” to duplicate a section item, then replace its text.</li>
            <li>Use the buttons above the preview to manage testimonials and gallery photos.</li>
          </ul>
        </div>
      );
    }
    const value = selectedValue ?? selected.value;
    if (selected.kind === 'image') {
      const url = typeof value === 'string' ? value : '';
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-ink"><ImageIcon size={15} /> {labelForPath(selected.path)}</div>
          {url && <img src={url} alt="" className="h-36 w-full rounded border border-line object-cover" />}
          <UploadButton endpoint="galleryUploader" label="Upload image" onClientUploadComplete={(res) => applyPath(selected.path, res?.[0]?.ufsUrl ?? '')} onUploadError={(error) => toast.error(error.message)} />
          <input value={url} onChange={(event) => applyPath(selected.path, event.target.value)} placeholder="Image URL" className="min-h-10 w-full rounded border border-line bg-white px-3 text-sm" />
          <p className="text-[11px] text-muted">Tip: use a wide image for hero banners and a square image for logos.</p>
        </div>
      );
    }
    if (selected.kind === 'link') {
      const link = value && typeof value === 'object' ? value : { label: '', to: '' };
      return (
        <div className="space-y-3">
          <p className="text-sm font-bold text-ink">{labelForPath(selected.path)}</p>
          <label className="block text-xs font-semibold text-muted">Label
            <input value={link.label ?? ''} onChange={(event) => applyPath(selected.path, { ...link, label: event.target.value })} className="mt-1 min-h-10 w-full rounded border border-line bg-white px-3 text-sm text-ink" />
          </label>
          <label className="block text-xs font-semibold text-muted">Link destination
            <input value={link.to ?? ''} onChange={(event) => applyPath(selected.path, { ...link, to: event.target.value })} placeholder="/admissions" className="mt-1 min-h-10 w-full rounded border border-line bg-white px-3 text-sm text-ink" />
          </label>
        </div>
      );
    }
    const text = typeof value === 'string' ? value : '';
    const multiline = text.length > 90 || /paragraph|body|text|description|quote|message/i.test(selected.path);
    return (
      <div className="space-y-3">
        <p className="text-sm font-bold text-ink">{labelForPath(selected.path)}</p>
        {multiline ? (
          <textarea value={text} onChange={(event) => applyPath(selected.path, event.target.value)} rows={7} className="w-full rounded border border-line bg-white px-3 py-2 text-sm leading-6 text-ink" />
        ) : (
          <input value={text} onChange={(event) => applyPath(selected.path, event.target.value)} className="min-h-10 w-full rounded border border-line bg-white px-3 text-sm text-ink" />
        )}
        <p className="text-[11px] text-muted">The preview updates as you type. Use Publish when the page is ready.</p>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Website"
        title="Customization"
        text="Edit every public page visually. Changes are saved as a draft and go live only when you publish."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {pageKey === 'home' && <button type="button" onClick={() => setTestimonialsOpen(true)} className="inline-flex min-h-10 items-center gap-2 rounded border border-line bg-white px-4 text-xs font-bold text-brand-800 hover:border-brand-500"><Sparkles size={14} /> Testimonials</button>}
            {pageKey === 'gallery' && <button type="button" onClick={() => setGalleryOpen(true)} className="inline-flex min-h-10 items-center gap-2 rounded border border-line bg-white px-4 text-xs font-bold text-brand-800 hover:border-brand-500"><ImageIcon size={14} /> Photos</button>}
            <button type="button" onClick={() => void resetDraft()} className="inline-flex min-h-10 items-center gap-2 rounded border border-line bg-white px-4 text-xs font-bold text-muted hover:border-brand-500 hover:text-ink"><RotateCcw size={14} /> Reset</button>
            <button type="button" onClick={() => void publish()} disabled={busy} className="inline-flex min-h-10 items-center gap-2 rounded bg-brand-500 px-4 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-60">
              {busy ? <LoaderCircle size={14} className="animate-spin" /> : <Send size={14} />} Publish
            </button>
          </div>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[190px_minmax(0,1fr)_320px]">
        <Card className="h-fit p-2">
          <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-[.18em] text-brand-700">Pages</p>
          <nav className="space-y-0.5">
            {SITE_PAGES.map((page) => (
              <button
                key={page.key}
                type="button"
                onClick={() => { setPageKey(page.key); setSelected(null); }}
                className={`flex w-full items-center justify-between rounded px-3 py-2 text-left text-xs font-bold ${pageKey === page.key ? 'bg-brand-50 text-brand-900' : 'text-muted hover:bg-cream hover:text-ink'}`}
              >
                {page.label}
                {pageKey === page.key && <Check size={13} />}
              </button>
            ))}
          </nav>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-3 py-2">
            <div className="flex items-center gap-1.5">
              {(['desktop', 'tablet', 'phone'] as const).map((size) => (
                <button key={size} type="button" onClick={() => setDevice(size)} className={`rounded border px-2.5 py-1 text-[10px] font-bold capitalize ${device === size ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-line text-muted'}`}>{size}</button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <Pill tone={saveState === 'error' ? 'rose' : saveState === 'saved' ? 'emerald' : 'amber'}>
                {saveState === 'saving' ? 'Saving…' : saveState === 'dirty' ? 'Unsaved' : saveState === 'error' ? 'Save failed' : 'Saved'}
              </Pill>
              <button type="button" onClick={() => void persist(overrideRef.current)} className="inline-flex items-center gap-1 rounded border border-line px-2 py-1 text-muted hover:text-ink"><Save size={11} /> Save draft</button>
              <a href="/" target="_blank" rel="noreferrer" className="text-brand-700 underline underline-offset-2">View site</a>
            </div>
          </div>
          <div className="flex min-h-[640px] justify-center overflow-auto bg-cream p-3">
            <iframe
              ref={iframeRef}
              key={pageKey}
              title={`${pageLabel} preview`}
              src={`/site-preview/${pageKey}`}
              className="h-[900px] max-h-[75vh] rounded border border-line bg-white shadow-sm"
              style={{ width: widths[device] }}
            />
          </div>
        </Card>

        <Card className="h-fit p-4">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-brand-700">Inspector</p>
          <div className="mt-3">{renderEditor()}</div>
          {parentArray && (
            <div className="mt-4 space-y-2 border-t border-line pt-3">
              <p className="text-[11px] font-semibold text-muted">Selected item {parentArray.index + 1} of {parentArray.array.length}</p>
              <div className="flex flex-wrap gap-1.5">
                <button type="button" onClick={addItem} className="inline-flex items-center gap-1 rounded border border-line px-2.5 py-1.5 text-[10px] font-bold hover:border-brand-400"><Plus size={11} /> Add item</button>
                <button type="button" onClick={() => moveItem(-1)} disabled={parentArray.index <= 0} className="inline-flex items-center gap-1 rounded border border-line px-2.5 py-1.5 text-[10px] font-bold disabled:opacity-40"><ArrowUp size={11} /> Up</button>
                <button type="button" onClick={() => moveItem(1)} disabled={parentArray.index >= parentArray.array.length - 1} className="inline-flex items-center gap-1 rounded border border-line px-2.5 py-1.5 text-[10px] font-bold disabled:opacity-40"><ArrowDown size={11} /> Down</button>
                <button type="button" onClick={removeItem} className="inline-flex items-center gap-1 rounded border border-rose-200 px-2.5 py-1.5 text-[10px] font-bold text-rose-700 hover:bg-rose-50"><Trash2 size={11} /> Remove</button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {testimonialsOpen && <SiteTestimonialsManager onClose={() => setTestimonialsOpen(false)} onChanged={reloadPreview} />}
      {galleryOpen && <SiteGalleryManager onClose={() => setGalleryOpen(false)} onChanged={reloadPreview} />}
    </div>
  );
};
