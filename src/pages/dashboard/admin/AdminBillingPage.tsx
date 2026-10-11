import { useState } from 'react';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pill, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';
import { useAuth } from '@/context/AuthContext';
import { apiGet } from '@/lib/api';
import { usePagedList } from '@/lib/pagedQuery';
import { CheckCircle2 } from 'lucide-react';

interface Txn {
  id: string;
  reference: string;
  amount: number;
  status: string;
  plan: string;
  kind: string;
  metadata?: { email?: string; phone?: string | null; formId?: string } | null;
  form?: { id: string; title: string } | null;
  createdAt: string;
}

type KindFilter = '' | 'SUBSCRIPTION' | 'FORM_PAYMENT';

/** All Paystack money movement: subscriptions + form fees, newest first. */
export const AdminBillingPage = () => {
  const { user } = useAuth();
  const [kind, setKind] = useState<KindFilter>('');
  const [notice, setNotice] = useState<string | null>(null);
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  const txns = usePagedList<Txn>(
    ['billing-txns', user?.workspaceId ?? '', kind],
    async (page, limit) => {
      const res = await apiGet<Txn[]>(`/billing/transactions/${user?.workspaceId}`, {});
      const all = (res.data ?? []).filter((t) => !kind || (t.kind || 'SUBSCRIPTION') === kind);
      const total = all.length;
      const start = (page - 1) * limit;
      return { data: all.slice(start, start + limit), meta: { total, page, limit } };
    },
    { initialLimit: 20 },
  );

  const verify = async (t: Txn) => {
    setRowBusy(t.reference);
    setNotice(null);
    try {
      await apiGet(`/billing/verify/${t.reference}`);
      setNotice(`${t.reference} re-verified.`);
      txns.invalidate();
    } catch (err: any) {
      setNotice(err?.message ?? 'Verify failed');
    } finally {
      setRowBusy(null);
    }
  };

  const emailOf = (t: Txn) => t.metadata?.email ?? '—';
  const phoneOf = (t: Txn) => t.metadata?.phone ?? '—';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Settings"
        title="Billing"
        text="Every Paystack transaction — plan subscriptions and form fees. Webhook failures land here as PENDING."
      />
      {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

      <Card>
        <CardHead title="Transactions" sub={`${txns.total} shown`} />
        <div className="flex flex-wrap gap-2 border-b border-line px-5 py-4" role="group" aria-label="Filter by kind">
          {([
            { value: '', label: 'All' },
            { value: 'SUBSCRIPTION', label: 'Subscriptions' },
            { value: 'FORM_PAYMENT', label: 'Form payments' },
          ] as Array<{ value: KindFilter; label: string }>).map((k) => (
            <button
              key={k.label}
              type="button"
              onClick={() => { setKind(k.value); txns.resetPage(); }}
              aria-pressed={kind === k.value}
              className={`min-h-10 rounded px-4 py-2 text-sm font-semibold ${kind === k.value ? 'bg-brand-700 text-white' : 'border border-line text-muted hover:border-brand-500 hover:text-brand-700'}`}
            >
              {k.label}
            </button>
          ))}
        </div>
        {txns.isPending ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={5} /></div>
        ) : txns.isError ? (
          <div className="px-5 py-5"><ErrorState message="Could not load transactions" onRetry={() => txns.refetch()} /></div>
        ) : txns.rows.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message="No transactions yet." /></div>
        ) : (
          <>
            <TableWrap>
              <table className={`w-full min-w-[880px] text-left text-sm transition-opacity ${txns.isFetching ? 'opacity-60' : ''}`}>
                <thead>
                  <tr>
                    <Th>Date</Th>
                    <Th>What</Th>
                    <Th>Email / Phone</Th>
                    <Th>Amount</Th>
                    <Th>Reference</Th>
                    <Th>Status</Th>
                    <Th><span className="sr-only">Verify</span></Th>
                  </tr>
                </thead>
                <tbody>
                  {txns.rows.map((t) => {
                    const isForm = (t.kind || 'SUBSCRIPTION') === 'FORM_PAYMENT';
                    return (
                      <tr key={t.id}>
                        <Td className="whitespace-nowrap text-muted">{new Date(t.createdAt).toLocaleString()}</Td>
                        <Td>
                          <span className="font-bold">{isForm ? (t.form?.title ?? 'Form payment') : t.plan}</span>
                          <span className="block text-xs text-muted">{isForm ? 'Form fee' : 'Subscription'}</span>
                        </Td>
                        <Td>
                          <span className="block font-semibold">{emailOf(t)}</span>
                          <span className="block text-xs text-muted">{phoneOf(t)}</span>
                        </Td>
                        <Td className="font-extrabold">₦{(t.amount / 100).toLocaleString()}</Td>
                        <Td className="font-mono text-xs text-muted">{t.reference}</Td>
                        <Td>
                          <Pill tone={t.status === 'SUCCESS' ? 'emerald' : t.status === 'FAILED' ? 'rose' : 'amber'}>
                            {t.status}
                          </Pill>
                        </Td>
                        <Td>
                          <button
                            type="button"
                            disabled={rowBusy === t.reference || t.status === 'SUCCESS'}
                            onClick={() => verify(t)}
                            title="Re-verify with Paystack"
                            className="inline-flex items-center gap-1 rounded border border-line px-2.5 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700 disabled:opacity-50"
                          >
                            <CheckCircle2 aria-hidden="true" size={14} /> Verify
                          </button>
                        </Td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-5 py-3 text-sm">
              <p className="text-muted">{txns.total} transaction(s) · page {txns.page} of {txns.pageCount}</p>
              <div className="flex gap-2">
                <button type="button" disabled={txns.page <= 1 || txns.isFetching} onClick={() => txns.setPage(txns.page - 1)} className="min-h-10 rounded border border-line px-4 text-sm font-bold hover:border-brand-500 hover:text-brand-700 disabled:opacity-50">← Prev</button>
                <button type="button" disabled={txns.page >= txns.pageCount || txns.isFetching} onClick={() => txns.setPage(txns.page + 1)} className="min-h-10 rounded border border-line px-4 text-sm font-bold hover:border-brand-500 hover:text-brand-700 disabled:opacity-50">Next →</button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
