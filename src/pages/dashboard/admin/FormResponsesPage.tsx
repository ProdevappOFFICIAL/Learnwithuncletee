import { useState } from 'react';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pagination, Pill } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { apiGet } from '@/lib/api';
import { usePagedList } from '@/lib/pagedQuery';
import type { FormFieldItem, FormItem, FormResponseItem } from '@/data/dashboard';

export const FormResponsesPage = () => {
  const [formId, setFormId] = useState('');
  const forms = useResource<FormItem[]>('/forms', { limit: 100 });

  const responses = usePagedList<FormResponseItem>(
    ['form-responses', formId],
    (page, limit) => apiGet<FormResponseItem>(`/forms/${formId}/responses`, { page, limit }),
  );
  const [fields, setFields] = useState<FormFieldItem[]>([]);
  const [detail, setDetail] = useState<FormResponseItem | null>(null);

  const loadFields = async (id: string) => {
    setFormId(id);
    responses.resetPage();
    if (!id) {
      setFields([]);
      return;
    }
    try {
      const res = await apiGet<FormItem>(`/forms/${id}`);
      setFields(res.data.fields ?? []);
    } catch {
      setFields([]);
    }
  };

  const labelOf = (fieldId: string) => fields.find((f) => f.id === fieldId)?.label ?? fieldId;

  const renderValue = (v: any) => {
    if (v === undefined || v === null || v === '') return <span className="text-muted">—</span>;
    if (typeof v === 'string' && /^https?:\/\//.test(v)) {
      return <a href={v} target="_blank" rel="noreferrer" className="font-bold text-brand-700 hover:underline">Open file</a>;
    }
    if (Array.isArray(v)) return <span>{v.join(', ')}</span>;
    return <span>{String(v)}</span>;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Forms"
        title="Responses"
        text="Every submission per form — emails, answers, uploads and payment status."
      />

      <Card>
        <CardHead title="Pick a form" sub={`${forms.data?.length ?? 0} form(s)`} />
        <div className="border-b border-line px-5 py-4">
          <select
            value={formId}
            onChange={(e) => loadFields(e.target.value)}
            aria-label="Select a form"
            className="min-h-11 w-full max-w-md rounded border border-line bg-white px-3 text-sm font-semibold"
          >
            <option value="">— Select a form —</option>
            {(forms.data ?? []).map((f) => (
              <option key={f.id} value={f.id}>{f.title}</option>
            ))}
          </select>
        </div>

        {!formId ? (
          <div className="px-5 py-5"><EmptyState message="Select a form to see its responses." /></div>
        ) : responses.isPending ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={4} /></div>
        ) : responses.isError ? (
          <div className="px-5 py-5"><ErrorState message="Could not load responses" onRetry={() => responses.refetch()} /></div>
        ) : responses.rows.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message="No responses yet — share the public link." /></div>
        ) : (
          <>
            <ul className={`divide-y divide-line transition-opacity ${responses.isFetching ? 'opacity-60' : ''}`}>
              {responses.rows.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setDetail(detail?.id === r.id ? null : r)}
                    aria-expanded={detail?.id === r.id}
                    className="flex w-full flex-wrap items-center justify-between gap-2 px-5 py-3.5 text-left hover:bg-brand-50/50"
                  >
                    <span>
                      <span className="block text-sm font-bold">{r.email}</span>
                      <span className="block text-xs text-muted">{new Date(r.createdAt).toLocaleString()}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      {r.paymentRef && <Pill tone={r.paymentStatus === 'PAID' ? 'emerald' : 'amber'}>{r.paymentStatus === 'PAID' ? 'Paid' : 'Unpaid'}</Pill>}
                      <span className="text-xs font-bold text-brand-700">{detail?.id === r.id ? 'Hide ▲' : 'View ▼'}</span>
                    </span>
                  </button>
                  {detail?.id === r.id && (
                    <dl className="space-y-2 border-t border-line bg-cream/60 px-5 py-4">
                      {Object.entries(r.answers ?? {}).map(([fid, v]) => (
                        <div key={fid} className="grid gap-1 text-sm sm:grid-cols-[200px_1fr]">
                          <dt className="font-bold">{labelOf(fid)}</dt>
                          <dd className="text-muted">{renderValue(v)}</dd>
                        </div>
                      ))}
                      {r.paymentRef && (
                        <div className="grid gap-1 text-sm sm:grid-cols-[200px_1fr]">
                          <dt className="font-bold">Payment ref</dt>
                          <dd className="font-mono text-xs text-muted">{r.paymentRef}</dd>
                        </div>
                      )}
                    </dl>
                  )}
                </li>
              ))}
            </ul>
            <Pagination
              total={responses.total}
              page={responses.page}
              pageCount={responses.pageCount}
              limit={responses.limit}
              onPage={responses.setPage}
              onLimit={responses.setLimit}
              disabled={responses.isFetching}
              noun="response(s)"
            />
          </>
        )}
      </Card>
    </div>
  );
};
