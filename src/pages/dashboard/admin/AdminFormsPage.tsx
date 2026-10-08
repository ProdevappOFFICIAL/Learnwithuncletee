import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pagination, Pill } from '@/components/dashboard/DashboardUI';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import { usePagedList } from '@/lib/pagedQuery';
import { ROUTES } from '@/routes/paths';
import type { FormFieldItem, FormItem } from '@/data/dashboard';
import { ArrowDown, ArrowUp, ExternalLink, Pencil, Plus, Trash2 } from 'lucide-react';

type FieldType = 'TEXT' | 'FILL_BLANK' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILE' | 'PAYMENT';

const FIELD_TYPES: Array<{ value: FieldType; label: string }> = [
  { value: 'TEXT', label: 'Text answer' },
  { value: 'FILL_BLANK', label: 'Fill in the blank' },
  { value: 'MULTIPLE_CHOICE', label: 'Multiple choice' },
  { value: 'TRUE_FALSE', label: 'True / False' },
  { value: 'FILE', label: 'File upload' },
  { value: 'PAYMENT', label: 'Paystack payment' },
];

interface DraftField {
  key: string;
  type: FieldType;
  label: string;
  required: boolean;
  optionsText: string;
}

const toDraft = (f: FormFieldItem, i: number): DraftField => ({
  key: f.id || `new-${i}`,
  type: (f.type as FieldType) || 'TEXT',
  label: f.label,
  required: !!f.required,
  optionsText: (f.options ?? []).join('\n'),
});

const inputClass = 'mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500';

export const AdminFormsPage = () => {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  const forms = usePagedList<FormItem>(
    ['admin-forms', query],
    (page, limit) => apiGet<FormItem[]>('/forms', { search: query || undefined, page, limit }),
  );

  // ── Builder state (Google-form style: click to add, arrows to reorder) ──
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [amountNaira, setAmountNaira] = useState('');
  const [fields, setFields] = useState<DraftField[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  // Keys of questions currently failing validation (empty label/options).
  const [invalidKeys, setInvalidKeys] = useState<string[]>([]);

  const resetBuilder = () => {
    setEditingId(null);
    setTitle('');
    setDescription('');
    setAmountNaira('');
    setFields([]);
  };

  const addField = (type: FieldType) => {
    if (type === 'PAYMENT' && fields.some((f) => f.type === 'PAYMENT')) {
      setNotice('Only one payment field per form.');
      return;
    }
    setFields((prev) => [...prev, { key: `new-${Date.now()}-${prev.length}`, type, label: '', required: false, optionsText: type === 'TRUE_FALSE' ? 'True\nFalse' : '' }]);
    setNotice(null);
  };

  const move = (key: string, dir: -1 | 1) => {
    setFields((prev) => {
      const i = prev.findIndex((f) => f.key === key);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };

  const startEdit = async (form: FormItem) => {
    setNotice(null);
    try {
      const res = await apiGet<FormItem>('/forms/' + form.id);
      const full = res.data;
      setEditingId(full.id);
      setTitle(full.title);
      setDescription(full.description ?? '');
      setAmountNaira(full.amountKobo > 0 ? String(full.amountKobo / 100) : '');
      setFields((full.fields ?? []).map(toDraft));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setNotice(err?.message ?? 'Could not load form');
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setNotice('Give the form a title.');
      return;
    }
    if (fields.length === 0) {
      setNotice('Add at least one question.');
      return;
    }
    const bad: string[] = [];
    for (const f of fields) {
      // Payment fields carry no label input — they validate on their own.
      if (f.type !== 'PAYMENT' && !f.label.trim()) {
        bad.push(f.key);
      }
      if ((f.type === 'MULTIPLE_CHOICE' || f.type === 'TRUE_FALSE') &&
          f.optionsText.split('\n').map((s) => s.trim()).filter(Boolean).length < 2) {
        bad.push(f.key);
      }
    }
    if (bad.length > 0) {
      setInvalidKeys(bad);
      setNotice('Some questions need attention — they are highlighted in red below.');
      requestAnimationFrame(() => {
        document.getElementById(`form-field-${bad[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      return;
    }
    setInvalidKeys([]);
    setBusy(true);
    setNotice(null);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        amountKobo: Math.round((parseFloat(amountNaira) || 0) * 100),
        fields: fields.map((f) => ({
          type: f.type,
          label: f.type === 'PAYMENT' ? 'Payment' : f.label.trim(),
          required: f.required,
          options: f.type === 'MULTIPLE_CHOICE' || f.type === 'TRUE_FALSE'
            ? f.optionsText.split('\n').map((s) => s.trim()).filter(Boolean)
            : undefined,
        })),
      };
      if (editingId) {
        await apiPatch('/forms/' + editingId, payload);
        setNotice('Form updated.');
      } else {
        await apiPost('/forms', payload);
        setNotice('Form created — publish it to open the public link.');
      }
      resetBuilder();
      forms.invalidate();
    } catch (err: any) {
      setNotice(err?.message ?? 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (form: FormItem, patch: { isPublished?: boolean; isClosed?: boolean }) => {
    try {
      await apiPatch('/forms/' + form.id, patch);
      forms.invalidate();
    } catch (err: any) {
      setNotice(err?.message ?? 'Update failed');
    }
  };

  const remove = async (form: FormItem) => {
    if (!confirm(`Delete form "${form.title}" and all its responses? This cannot be undone.`)) return;
    try {
      await apiDelete('/forms/' + form.id);
      if (editingId === form.id) resetBuilder();
      forms.invalidate();
    } catch (err: any) {
      setNotice(err?.message ?? 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Forms"
        title="Manage forms"
        text="Build response forms with questions, file uploads and an optional Paystack fee."
      />
      {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

      <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">{editingId ? 'Edit' : 'Compose'}</p>
          <h3 className="mt-2 font-display text-lg font-extrabold">{editingId ? 'Edit form' : 'New form'}</h3>
          <form className="mt-5 space-y-4" onSubmit={save}>
            <label className="block text-sm font-semibold">Title
              <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Excursion consent" className={inputClass} />
            </label>
            <label className="block text-sm font-semibold">Description (shown on the public page)
              <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this form for?" className="mt-2 w-full rounded border border-line bg-white px-3 py-3 text-sm outline-none focus:border-brand-500" />
            </label>
            <label className="block text-sm font-semibold">Fee in naira (0 = free, Paystack required otherwise)
              <input value={amountNaira} onChange={(e) => setAmountNaira(e.target.value)} inputMode="decimal" placeholder="0" className={inputClass} />
            </label>

            <div>
              <p className="text-sm font-semibold">Add question</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {FIELD_TYPES.map((t) => (
                  <button key={t.value} type="button" onClick={() => addField(t.value)} className="inline-flex min-h-10 items-center rounded border border-line bg-white px-3 text-xs font-bold hover:border-brand-500 hover:text-brand-700">
                    <Plus aria-hidden="true" size={13} className="mr-1" /> {t.label}
                  </button>
                ))}
              </div>
            </div>

            {fields.length > 0 && (
              <ul className="space-y-3">
                {fields.map((f, i) => {
                  const bad = invalidKeys.includes(f.key);
                  return (
                  <li key={f.key} id={`form-field-${f.key}`} className={`rounded border bg-cream p-3 ${bad ? 'border-rose-400 ring-2 ring-rose-100' : 'border-line'}`}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-brand-700">
                        {i + 1} · {FIELD_TYPES.find((t) => t.value === f.type)?.label}
                      </p>
                      <span className="flex gap-1">
                        <button type="button" disabled={i === 0} onClick={() => move(f.key, -1)} aria-label="Move up" className="rounded border border-line bg-white px-2 py-1 text-xs font-bold disabled:opacity-40"><ArrowUp size={13} aria-hidden="true" /></button>
                        <button type="button" disabled={i === fields.length - 1} onClick={() => move(f.key, 1)} aria-label="Move down" className="rounded border border-line bg-white px-2 py-1 text-xs font-bold disabled:opacity-40"><ArrowDown size={13} aria-hidden="true" /></button>
                        <button type="button" onClick={() => setFields((prev) => prev.filter((x) => x.key !== f.key))} aria-label="Remove question" className="rounded border border-line bg-white px-2 py-1 text-xs font-bold text-rose-700 disabled:opacity-40"><Trash2 size={13} aria-hidden="true" /></button>
                      </span>
                    </div>
                    {f.type !== 'PAYMENT' ? (
                      <>
                        <input value={f.label} onChange={(e) => { const v = e.target.value; setFields((prev) => prev.map((x) => x.key === f.key ? { ...x, label: v } : x)); if (v.trim()) setInvalidKeys((prev) => prev.filter((k) => k !== f.key)); }} placeholder="Question label" aria-invalid={bad} className={`${inputClass} bg-white ${bad && !f.label.trim() ? 'border-rose-400' : ''}`} />
                        {bad && !f.label.trim() && <p className="mt-1 text-xs font-bold text-rose-700">Label is empty — give this question a name.</p>}
                        {(f.type === 'MULTIPLE_CHOICE' || f.type === 'TRUE_FALSE') && (
                          <>
                            <textarea rows={3} value={f.optionsText} onChange={(e) => { const v = e.target.value; setFields((prev) => prev.map((x) => x.key === f.key ? { ...x, optionsText: v } : x)); if (v.split('\n').map((s) => s.trim()).filter(Boolean).length >= 2) setInvalidKeys((prev) => prev.filter((k) => k !== f.key)); }} placeholder="Options — one per line (min 2)" aria-invalid={bad} className={`mt-2 w-full rounded border bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 ${bad ? 'border-rose-400' : 'border-line'}`} />
                            {bad && <p className="mt-1 text-xs font-bold text-rose-700">Add at least 2 options, one per line.</p>}
                          </>
                        )}
                        <label className="mt-2 flex items-center gap-2 text-xs font-semibold">
                          <input type="checkbox" checked={f.required} onChange={(e) => setFields((prev) => prev.map((x) => x.key === f.key ? { ...x, required: e.target.checked } : x))} className="h-4 w-4 accent-brand-700" />
                          Required
                        </label>
                      </>
                    ) : (
                      <p className="mt-2 text-xs text-muted">Shows a <b>Pay with Paystack</b> button for the fee above. Only one per form.</p>
                    )}
                  </li>
                );
                })}
              </ul>
            )}

            <div className="flex flex-wrap gap-2">
              <button type="submit" disabled={busy} className="min-h-11 flex-1 rounded bg-brand-900 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
                {busy ? 'Saving…' : editingId ? 'Save changes' : 'Create form'}
              </button>
              {editingId && (
                <button type="button" onClick={resetBuilder} className="min-h-11 rounded border border-line bg-white px-5 py-3 text-sm font-bold text-muted hover:text-ink">
                  Cancel
                </button>
              )}
            </div>
          </form>
        </Card>

        <Card>
          <CardHead title="All forms" sub={`${forms.total} shown`} />
          <form
            className="flex flex-wrap gap-2 border-b border-line px-5 py-4"
            onSubmit={(e) => {
              e.preventDefault();
              setQuery(search);
              forms.resetPage();
            }}
          >
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title…" aria-label="Search forms" className="min-h-11 w-full max-w-xs rounded border border-line px-3 text-sm outline-none focus:border-brand-500" />
            <button type="submit" className="min-h-11 rounded bg-brand-900 px-4 text-sm font-bold text-white hover:bg-brand-700">Search</button>
            {search && (
              <button type="button" onClick={() => { setSearch(''); setQuery(''); forms.resetPage(); }} className="min-h-11 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink">
                Reset
              </button>
            )}
          </form>
          {forms.isPending ? (
            <div className="px-5 py-5"><LoadingSkeleton rows={4} /></div>
          ) : forms.isError ? (
            <div className="px-5 py-5"><ErrorState message="Could not load forms" onRetry={() => forms.refetch()} /></div>
          ) : forms.rows.length === 0 ? (
            <div className="px-5 py-5"><EmptyState message={query ? 'No forms match your search.' : 'No forms yet — build the first one.'} /></div>
          ) : (
            <>
              <ul className={`divide-y divide-line transition-opacity ${forms.isFetching ? 'opacity-60' : ''}`}>
                {forms.rows.map((f) => (
                  <li key={f.id} className="px-5 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill tone={f.isPublished && !f.isClosed ? 'emerald' : 'amber'}>
                        {!f.isPublished ? 'Draft' : f.isClosed ? 'Closed' : 'Live'}
                      </Pill>
                      {f.amountKobo > 0 && <Pill tone="sky">₦{(f.amountKobo / 100).toLocaleString()} fee</Pill>}
                      <span className="text-xs text-muted">{f._count?.responses ?? 0} responses · {f._count?.fields ?? 0} questions</span>
                    </div>
                    <h4 className="mt-2 font-display text-sm font-extrabold">{f.title}</h4>
                    {f.isPublished && (
                      <Link to={ROUTES.formPublic.replace(':id', f.id)} className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:underline">
                        <ExternalLink aria-hidden="true" size={12} /> Open public link
                      </Link>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => startEdit(f)} className="inline-flex items-center rounded border border-line px-3 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700"><Pencil aria-hidden="true" size={14} className="mr-1" /> Edit</button>
                      <button type="button" onClick={() => toggle(f, { isPublished: !f.isPublished })} className="rounded border border-line px-3 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700">{f.isPublished ? 'Unpublish' : 'Publish'}</button>
                      {f.isPublished && (
                        <button type="button" onClick={() => toggle(f, { isClosed: !f.isClosed })} className="rounded border border-line px-3 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700">{f.isClosed ? 'Reopen' : 'Close'}</button>
                      )}
                      <button type="button" onClick={() => remove(f)} className="rounded border border-line px-3 py-1.5 text-xs font-bold text-rose-700 hover:border-rose-300">Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
              <Pagination
                total={forms.total}
                page={forms.page}
                pageCount={forms.pageCount}
                limit={forms.limit}
                onPage={forms.setPage}
                onLimit={forms.setLimit}
                disabled={forms.isFetching}
                noun="form(s)"
              />
            </>
          )}
        </Card>
      </div>
    </div>
  );
};
