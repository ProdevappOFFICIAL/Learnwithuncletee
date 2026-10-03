import { useState } from 'react';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pill, StatTile, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { apiPost, formatNaira } from '@/lib/api';

interface InvoiceRow {
  id: string;
  invoiceNo: string;
  term: string;
  amountKobo: number;
  paidKobo: number;
  status: string;
  student: { user_name: string };
}

export const AdminFeesPage = () => {
  const invoices = useResource<InvoiceRow[]>('/fees', { limit: 50 });
  const payments = useResource<Array<{ id: string; amountKobo: number; method: string; reference: string; status: string; createdAt: string; invoice: { invoiceNo: string; student: { user_name: string } } }>>('/fees/payments', { limit: 20 });
  const [form, setForm] = useState({ studentId: '', term: 'First Term 2026/27', amountNaira: '' });
  const [notice, setNotice] = useState<string | null>(null);

  const rows = invoices.data ?? [];
  const expected = rows.reduce((s, i) => s + i.amountKobo, 0);
  const collected = rows.reduce((s, i) => s + i.paidKobo, 0);

  const raise = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    try {
      await apiPost('/fees', form);
      setNotice('Invoice raised.');
      setForm({ studentId: '', term: 'First Term 2026/27', amountNaira: '' });
      invoices.reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Failed to raise invoice');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Finance" title="Fees & payments" text="Invoices, collections and receipts for the whole school." />
      {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Expected (loaded)" value={formatNaira(expected)} hint={`${rows.length} invoice(s)`} />
        <StatTile label="Collected" value={formatNaira(collected)} hint={expected ? `${Math.round((collected / expected) * 100)}%` : '—'} />
        <StatTile label="Outstanding" value={formatNaira(expected - collected)} hint="Follow-up list" />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHead title="Invoices" sub="All terms" />
          {invoices.loading ? (
            <div className="px-5 py-5"><LoadingSkeleton rows={4} /></div>
          ) : invoices.error || !invoices.data ? (
            <div className="px-5 py-5"><ErrorState message={invoices.error ?? 'No data'} onRetry={invoices.reload} /></div>
          ) : rows.length === 0 ? (
            <div className="px-5 py-5"><EmptyState message="No invoices yet — raise the first one." /></div>
          ) : (
            <TableWrap>
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead><tr><Th>Invoice</Th><Th>Amount</Th><Th>Status</Th></tr></thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.id}>
                      <Td><span className="font-bold">{t.invoiceNo}</span><span className="block text-xs text-muted">{t.student.user_name} · {t.term}</span></Td>
                      <Td className="font-extrabold text-brand-700">{formatNaira(t.amountKobo)}</Td>
                      <Td><Pill tone={t.status === 'PAID' ? 'emerald' : 'amber'}>{t.status.replace('_', ' ')}</Pill></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Card>

        <div className="space-y-5">
          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Raise invoice</p>
            <form onSubmit={raise} className="mt-4 space-y-3">
              <label className="block text-sm font-semibold">Student user ID<input required value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} placeholder="Copy from Students directory" className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500" /></label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-semibold">Term<input required value={form.term} onChange={(e) => setForm({ ...form, term: e.target.value })} className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm" /></label>
                <label className="block text-sm font-semibold">Amount (₦)<input required type="number" min={1} value={form.amountNaira} onChange={(e) => setForm({ ...form, amountNaira: e.target.value })} placeholder="185000" className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm" /></label>
              </div>
              <button type="submit" className="min-h-11 w-full rounded bg-brand-900 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700">+ Raise invoice</button>
            </form>
          </Card>

          <Card>
            <CardHead title="Recent payments" sub="Receipts and confirmations" />
            {payments.loading ? (
              <div className="px-5 py-5"><LoadingSkeleton rows={3} /></div>
            ) : payments.error || !payments.data ? (
              <div className="px-5 py-5"><ErrorState message={payments.error ?? 'No data'} onRetry={payments.reload} /></div>
            ) : payments.data.length === 0 ? (
              <div className="px-5 py-5"><EmptyState message="No payments yet." /></div>
            ) : (
              <ul className="divide-y divide-line">
                {payments.data.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <div><p className="text-sm font-bold">{formatNaira(p.amountKobo)} · {p.invoice.student.user_name}</p><p className="text-xs text-muted">{p.reference} · {p.method} · {new Date(p.createdAt).toLocaleDateString()}</p></div>
                    <Pill tone={p.status === 'CONFIRMED' ? 'emerald' : 'amber'}>{p.status}</Pill>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
