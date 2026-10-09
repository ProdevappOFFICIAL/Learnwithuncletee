import { useState } from 'react';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pagination, Pill } from '@/components/dashboard/DashboardUI';
import { AnswerValue } from '@/components/dashboard/FormFiles';
import { useResource } from '@/context/AuthContext';
import { apiDelete, apiGet } from '@/lib/api';
import { usePagedList } from '@/lib/pagedQuery';
import type { FormFieldItem, FormItem, FormResponseItem } from '@/data/dashboard';
import { Trash2 } from 'lucide-react';

export const FormResponsesPage = () => {
  const [formId, setFormId] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const forms = useResource<FormItem[]>('/forms', { limit: 100 });

  const responses = usePagedList<FormResponseItem>(
    ['form-responses', formId],
    (page, limit) => apiGet<FormResponseItem[]>(`/forms/${formId}/responses`, { page, limit }),
  );
  const [fields, setFields] = useState<FormFieldItem[]>([]);
  const [detail, setDetail] = useState<FormResponseItem | null>(null);

  const loadFields = async (id: string) => {
    setFormId(id);
    setDetail(null);
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

  const removeOne = async (r: FormResponseItem) => {
    if (!confirm(`Delete ${r.email}'s response? This cannot be undone.`)) return;
    setRowBusy(r.id);
    try {
      await apiDelete(`/forms/${formId}/responses/${r.id}`);
      if (detail?.id === r.id) setDetail(null);
      setNotice('Response deleted.');
      responses.invalidate();
    } catch (err: any) {
      setNotice(err?.message ?? 'Delete failed');
    } finally {
      setRowBusy(null);
    }
  };

  const removeAll = async () => {
    if (responses.total === 0) return;
    if (!confirm(`Delete ALL ${responses.total} responses to this form? This cannot be undone.`)) return;
    setRowBusy('all');
    try {
      await apiDelete(`/forms/${formId}/responses`);
      setDetail(null);
      setNotice('All responses deleted.');
      responses.invalidate();
    } catch (err: any) {
      setNotice(err?.message ?? 'Delete failed');
    } finally {
      setRowBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Forms"
        title="Responses"
        text="Every submission per form — emails, answers, uploads and payment status."
        actions={
          formId && responses.total > 0 ? (
            <button
              type="button"
              disabled={rowBusy === 'all'}
              onClick={removeAll}
              className="inline-flex min-h-11 items-center rounded border border-rose-300 bg-white px-5 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
            >
              <Trash2 aria-hidden="true" size={16} className="mr-2" /> Delete all ({responses.total})
            </button>
          ) : undefined
        }
      />
      {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

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
                  <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5">
                    <button
                      type="button"
                      onClick={() => setDetail(detail?.id === r.id ? null : r)}
                      aria-expanded={detail?.id === r.id}
                      className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-left"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold">{r.email}</span>
                        <span className="block text-xs text-muted">{new Date(r.createdAt).toLocaleString()}</span>
                      </span>
                    </button>
                    <span className="flex shrink-0 items-center gap-2">
                      {r.paymentRef && <Pill tone={r.paymentStatus === 'PAID' ? 'emerald' : 'amber'}>{r.paymentStatus === 'PAID' ? 'Paid' : 'Unpaid'}</Pill>}
                      <button type="button" onClick={() => setDetail(detail?.id === r.id ? null : r)} className="text-xs font-bold text-brand-700 hover:underline">
                        {detail?.id === r.id ? 'Hide ▲' : 'View ▼'}
                      </button>
                      <button
                        type="button"
                        disabled={rowBusy === r.id}
                        onClick={() => removeOne(r)}
                        aria-label={`Delete ${r.email}'s response`}
                        title="Delete response"
                        className="rounded border border-line px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:border-rose-300 disabled:opacity-60"
                      >
                        <Trash2 aria-hidden="true" size={14} />
                      </button>
                    </span>
                  </div>
                  {detail?.id === r.id && (
                    <dl className="space-y-3 border-t border-line bg-cream/60 px-5 py-4">
                      {Object.entries(r.answers ?? {}).map(([fid, v]) => (
                        <div key={fid} className="grid gap-1 text-sm sm:grid-cols-[200px_1fr]">
                          <dt className="font-bold">{labelOf(fid)}</dt>
                          <dd className="min-w-0 text-muted"><AnswerValue value={v} /></dd>
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
