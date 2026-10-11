import { useEffect, useState } from 'react';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pill, StatTile, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';
import { useAuth } from '@/context/AuthContext';
import { apiGet } from '@/lib/api';
import { usePagedList } from '@/lib/pagedQuery';
import { CheckCircle2 } from 'lucide-react';

interface PayTxn {
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

/** Form payments + all Paystack transactions: collected totals and per-row verify. */
export const AdminPaymentPage = () => {
  const { user } = useAuth();
  const [kind, setKind] = useState<KindFilter>('FORM_PAYMENT');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  const txns = usePagedList<PayTxn>(
    ['payment-txns', user?.workspaceId ?? '', kind, query],
    async (page, limit) => {
      const res = await apiGet<PayTxn[]>(`/billing/transactions/${user?.workspaceId}`, {});
      const q = query.trim().toLowerCase();
      const all = (res.data ?? []).filter((t) => {
        if (kind && (t.kind || 'SUBSCRIPTION') !== kind) return false;
        if (!q) return true;
        return (
          (t.metadata?.email ?? '').toLowerCase().includes(q) ||
          (t.metadata?.phone ?? '').toLowerCase().includes(q) ||
          t.reference.toLowerCase().includes(q) ||
          (t.form?.title ?? '').toLowerCase().includes(q)
        );
      });
      const total = all.length;
      const start = (page - 1) * limit;
      return { data: all.slice(start, start + limit), meta: { total, page, limit } };
    },
    { initialLimit: 20 },
  );

  // Totals across the whole filtered set (not just the page).
  const [totals, setTotals] = useState({ collected: 0, formRevenue: 0, subRevenue: 0, pending: 0 });
  const [totalsTick, setTotalsTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await apiGet<PayTxn[]>(`/billing/transactions/${user?.workspaceId}`, {});
        if (cancelled) return;
        const q = query.trim().toLowerCase();
        const all = (res.data ?? []).filter((t) => {
          if (kind && (t.kind || 'SUBSCRIPTION') !== kind) return false;
          if (!q) return true;
          return (
            (t.metadata?.email ?? '').toLowerCase().includes(q) ||
            (t.metadata?.phone ?? '').toLowerCase().includes(q) ||
            t.reference.toLowerCase().includes(q) ||
            (t.form?.title ?? '').toLowerCase().includes(q)
          );
        });
        let collected = 0;
        let formRevenue = 0;
        let subRevenue = 0;
        let pending = 0;
        for (const t of all) {
          if (t.status === 'SUCCESS') {
            collected += t.amount;
            if ((t.kind || 'SUBSCRIPTION') === 'FORM_PAYMENT') formRevenue += t.amount;
            else subRevenue += t.amount;
          } else if (t.status === 'PENDING') {
            pending += 1;
          }
        }
        setTotals({ collected, formRevenue, subRevenue, pending });
      } catch {
        /* tiles stay stale — table shows the error */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.workspaceId, kind, query, totalsTick]);

  const verify = async (t: PayTxn) => {
    setRowBusy(t.reference);
    setNotice(null);
    try {
      await apiGet(`/billing/verify/${t.reference}`);
      setNotice(`${t.reference} re-verified.`);
      setTotalsTick((n) => n + 1);
      txns.invalidate();
    } catch (err: any) {
      setNotice(err?.message ?? 'Verify failed');
    } finally {
      setRowBusy(null);
    }
  };

  const naira = (kobo: number) => `₦${(kobo / 100).toLocaleString()}`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Forms"
        title="Payments & Transactions"
        text="Every naira through Paystack — form fees and plan subscriptions. Verify stuck rows here."
      />
      {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Collected" value={naira(totals.collected)} hint="successful charges" />
        <StatTile label="Form revenue" value={naira(totals.formRevenue)} hint="paid form responses" />
        <StatTile label="Subscriptions" value={naira(totals.subRevenue)} hint="plan purchases" />
        <StatTile label="Pending" value={String(totals.pending)} hint="unconfirmed references" />
      </div>

      <Card>
        <CardHead title="Transactions" sub={`${txns.total} shown · newest first`} />
        <form
          className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search);
            txns.resetPage();
          }}
        >
          <div className="flex gap-1 rounded border border-line p-1" role="group" aria-label="Filter by kind">
            {([
              { value: 'FORM_PAYMENT', label: 'Form payments' },
              { value: 'SUBSCRIPTION', label: 'Subscriptions' },
              { value: '', label: 'All' },
            ] as Array<{ value: KindFilter; label: string }>).map((k) => (
              <button
                key={k.label}
                type="button"
                onClick={() => { setKind(k.value); txns.resetPage(); }}
                aria-pressed={kind === k.value}
                className={`min-h-10 rounded px-4 py-1.5 text-xs font-bold ${kind === k.value ? 'bg-brand-900 text-white' : 'text-muted hover:text-ink'}`}
              >
                {k.label}
              </button>
            ))}
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email, phone, ref, form…"
            aria-label="Search transactions"
            className="min-h-11 w-full max-w-xs rounded border border-line px-3 text-sm outline-none focus:border-brand-500"
          />
          <button type="submit" className="min-h-11 rounded bg-brand-900 px-4 text-sm font-bold text-white hover:bg-brand-700">Search</button>
          {(search || kind !== 'FORM_PAYMENT') && (
            <button type="button" onClick={() => { setSearch(''); setQuery(''); setKind('FORM_PAYMENT'); txns.resetPage(); }} className="min-h-11 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink">
              Reset
            </button>
          )}
        </form>
        {txns.isPending ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={5} /></div>
        ) : txns.isError ? (
          <div className="px-5 py-5"><ErrorState message="Could not load transactions" onRetry={() => txns.refetch()} /></div>
        ) : txns.rows.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message={query ? 'No transactions match your search.' : 'No payments yet — paid form responses land here.'} /></div>
        ) : (
          <>
            <TableWrap>
              <table className={`w-full min-w-[920px] text-left text-sm transition-opacity ${txns.isFetching ? 'opacity-60' : ''}`}>
                <thead>
                  <tr>
                    <Th>Date</Th>
                    <Th>Payer</Th>
                    <Th>Item</Th>
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
                          <span className="block font-bold">{t.metadata?.email ?? '—'}</span>
                          <span className="block text-xs text-muted">{t.metadata?.phone ?? ''}</span>
                        </Td>
                        <Td>
                          <span className="font-bold">{isForm ? (t.form?.title ?? 'Form payment') : t.plan}</span>
                          <span className="block text-xs text-muted">{isForm ? 'Form fee' : 'Subscription'}</span>
                        </Td>
                        <Td className="font-extrabold text-brand-700">{naira(t.amount)}</Td>
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
