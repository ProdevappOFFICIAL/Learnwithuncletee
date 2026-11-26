import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader } from '@/components/dashboard/DashboardUI';
import { apiGet } from '@/lib/api';
import { ROUTES } from '@/routes/paths';
import type { FormItem } from '@/data/dashboard';

interface PreviewField {
  type: string;
  label: string;
  required: boolean;
  options?: string[] | null;
  optionsText?: string;
  accept?: string[];
}

interface PreviewDraft {
  title: string;
  description?: string;
  coverUrl?: string;
  amountKobo?: number;
  amountNaira?: string;
  fields: PreviewField[];
}

/**
 * Read-only form preview as a sub-page (not a dialog): breadcrumb
 * Forms / Manage / Preview, banner hero, then the questions exactly as
 * respondents see them. Accepts an unsaved builder draft via route state
 * (like the news preview) or a saved form id.
 */
export const AdminFormPreviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state ?? {}) as { draft?: PreviewDraft; formId?: string };
  const [saved, setSaved] = useState<FormItem | null>(null);
  const [loading, setLoading] = useState(!!state.formId && !state.draft);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (state.formId && !state.draft) {
      apiGet<FormItem>(`/forms/${state.formId}`)
        .then((res) => setSaved(res.data))
        .catch((e: any) => setError(e?.message ?? 'Could not load form'))
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const draft = state.draft;
  const title = draft?.title?.trim() || saved?.title || 'Untitled form';
  const description = (draft?.description ?? saved?.description ?? '').trim();
  const coverUrl = draft?.coverUrl || saved?.coverUrl || '';
  const amountKobo = draft?.amountKobo ?? (draft?.amountNaira ? Math.round((parseFloat(draft.amountNaira) || 0) * 100) : (saved?.amountKobo ?? 0));
  const fields: PreviewField[] = draft
    ? draft.fields
    : ((saved?.fields ?? []) as PreviewField[]);

  const optionsOf = (f: PreviewField): string[] => {
    if (Array.isArray(f.options)) return f.options;
    if (typeof f.optionsText === 'string') return f.optionsText.split('\n').map((s) => s.trim()).filter(Boolean);
    return [];
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Forms · Preview"
        title={title}
        text="Preview only — respondents see this layout. Nothing here accepts answers."
        actions={
          <button
            type="button"
            onClick={() => navigate(ROUTES.adminForms)}
            className="inline-flex min-h-11 items-center rounded border border-line bg-white px-5 py-2.5 text-sm font-bold text-ink hover:border-brand-500 hover:text-brand-700"
          >
            Back to Manage
          </button>
        }
      />
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link to={ROUTES.adminForms} className="font-bold text-brand-700 hover:text-brand-500">Forms</Link>
        <span className="px-2">/</span>
        <Link to={ROUTES.adminForms} className="font-bold text-brand-700 hover:text-brand-500">Manage</Link>
        <span className="px-2">/</span>
        <span className="text-ink" aria-current="page">Preview</span>
      </nav>

      <Card>
        <CardHead title="Respondent view" sub={draft ? 'Unsaved draft' : 'Saved form'} />
        {loading ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={4} /></div>
        ) : error || (!draft && !saved) ? (
          <div className="px-5 py-5"><ErrorState message={error ?? 'Nothing to preview'} onRetry={() => navigate(ROUTES.adminForms)} /></div>
        ) : (
          <div className="px-5 py-5">
            {coverUrl && <img src={coverUrl} alt="" className="h-44 w-full rounded border border-line object-cover" />}
            <h3 className="mt-4 font-display text-xl font-extrabold">{title}</h3>
            {description && <p className="mt-1 text-sm text-muted">{description}</p>}
            {amountKobo > 0 && (
              <p className="mt-3 border-l-2 border-lime-accent bg-brand-50 px-4 py-2 text-sm text-brand-800">
                Fee: <b>₦{(amountKobo / 100).toLocaleString()}</b> via Paystack
              </p>
            )}
            <div className="mt-4">
              <p className="text-sm font-semibold">Email address</p>
              <div className="mt-2 min-h-12 rounded border border-line bg-cream px-3 py-3 text-sm text-muted">you@example.com</div>
            </div>
            <div className="mt-4 space-y-4">
              {fields.map((f, i) => (
                <div key={i}>
                  {f.type === 'PAYMENT' ? (
                    <div className="rounded border border-line bg-cream p-4">
                      <p className="text-sm font-bold">Payment — ₦{(amountKobo / 100).toLocaleString()}</p>
                      <span className="mt-3 inline-block rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white">Pay with Paystack</span>
                    </div>
                  ) : f.type === 'MULTIPLE_CHOICE' || f.type === 'TRUE_FALSE' ? (
                    <fieldset>
                      <legend className="text-sm font-semibold">{f.label || '(untitled question)'} {f.required && <span className="text-rose-700">*</span>}</legend>
                      <div className="mt-2 space-y-2">
                        {optionsOf(f).map((opt) => (
                          <span key={opt} className="flex items-center gap-3 rounded border border-line px-4 py-3 text-sm">
                            <span className="h-4 w-4 rounded-full border border-line" />
                            {opt}
                          </span>
                        ))}
                        {optionsOf(f).length === 0 && <p className="text-xs text-muted">No options yet.</p>}
                      </div>
                    </fieldset>
                  ) : f.type === 'FILE' ? (
                    <div>
                      <p className="text-sm font-semibold">{f.label || '(untitled question)'} {f.required && <span className="text-rose-700">*</span>}</p>
                      <span className="mt-2 inline-block rounded border border-line bg-white px-5 py-2.5 text-sm font-bold text-muted">
                        Choose file & upload{(f.accept?.length ?? 0) > 0 ? ` (${(f.accept ?? []).join(', ').toUpperCase()})` : ''}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-semibold">{f.label || '(untitled question)'} {f.required && <span className="text-rose-700">*</span>}</p>
                      <div className="mt-2 min-h-12 rounded border border-line bg-cream px-3 py-3 text-sm text-muted">
                        {f.type === 'FILL_BLANK' ? 'Fill in the blank…' : 'Your answer…'}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {fields.length === 0 && <EmptyState message="No questions yet." />}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
