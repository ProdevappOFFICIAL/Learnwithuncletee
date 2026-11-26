import { useState } from 'react';
import { BannerCard, Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pill, StatTile, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { apiPost, formatNaira } from '@/lib/api';
import type { InvoiceData } from '@/data/dashboard';

const statusTone = (s: string) => (s === 'PAID' ? 'emerald' : s === 'UNPAID' || s === 'OVERDUE' ? 'rose' : 'amber') as 'emerald' | 'amber' | 'rose';

export const StudentFeesPage = () => {
  const { data, loading, error, reload } = useResource<InvoiceData[]>('/fees/mine');
  const [paying, setPaying] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const outstanding = (data ?? []).reduce((s, i) => s + (i.amountKobo - i.paidKobo), 0);
  const paid = (data ?? []).reduce((s, i) => s + i.paidKobo, 0);

  const pay = async (invoiceId: string, balanceKobo: number) => {
    setPaying(invoiceId);
    setNotice(null);
    try {
      await apiPost(`/fees/${invoiceId}/pay`, { amountNaira: balanceKobo / 100, method: 'Transfer' });
      setNotice('Payment recorded. Receipt sent to your guardian.');
      reload();
    } catch (e: any) {
      setNotice(e?.message ?? 'Payment failed');
    } finally {
      setPaying(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fees"
        title="Fees & payments"
        text="Track invoices, receipts and outstanding balances. Contact Central Admin on +2347039334594 for help."
      />

      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : error || !data ? (
        <ErrorState message={error ?? 'No data'} onRetry={reload} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile label="Outstanding balance" value={formatNaira(outstanding)} hint="Across all terms" />
            <StatTile label="Paid to date" value={formatNaira(paid)} hint={`${data.length} invoice(s)`} />
            <StatTile label="Next due date" value={data.find((i) => i.status !== 'PAID')?.dueDate ? new Date(data.find((i) => i.status !== 'PAID')!.dueDate!).toLocaleDateString() : '—'} hint="Avoid late charges" />
          </div>

          {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

          <BannerCard
            eyebrow="Pay securely"
            title={`Balance: ${formatNaira(outstanding)}`}
            text="Pay by bank transfer, card or at the school accounts office. Receipts appear here instantly after confirmation."
            image="/img_1.jpeg"
          />

          <Card>
            <CardHead title="Fee history" sub="Invoices and receipts" />
            {data.length === 0 ? (
              <div className="px-5 py-5"><EmptyState message="No invoices yet." /></div>
            ) : (
              <TableWrap>
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead><tr><Th>Invoice</Th><Th>Term</Th><Th>Amount</Th><Th>Paid</Th><Th>Balance</Th><Th>Status</Th><Th><span className="sr-only">Actions</span></Th></tr></thead>
                  <tbody>
                    {data.map((f) => (
                      <tr key={f.id}>
                        <Td className="font-bold">{f.invoiceNo}<span className="block text-xs font-medium text-muted">{f.dueDate ? new Date(f.dueDate).toLocaleDateString() : ''}</span></Td>
                        <Td>{f.term}</Td>
                        <Td className="font-semibold">{formatNaira(f.amountKobo)}</Td>
                        <Td>{formatNaira(f.paidKobo)}</Td>
                        <Td className="font-bold text-brand-700">{formatNaira(f.amountKobo - f.paidKobo)}</Td>
                        <Td><Pill tone={statusTone(f.status)}>{f.status.replace('_', ' ')}</Pill></Td>
                        <Td>
                          {f.status !== 'PAID' && (
                            <button type="button" disabled={paying === f.id} onClick={() => pay(f.id, f.amountKobo - f.paidKobo)} className="rounded bg-brand-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-60">
                              {paying === f.id ? '…' : 'Pay now'}
                            </button>
                          )}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            )}
          </Card>
        </>
      )}
    </div>
  );
};
