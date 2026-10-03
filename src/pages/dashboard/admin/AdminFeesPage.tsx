import { Card, CardHead, PageHeader, Pill, StatTile, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';

const txns = [
  { id: 'TXN-90412', pupil: 'Daniel E. · JSS 2', amount: '₦140,000', method: 'Bank transfer', date: '02 Oct 2026', status: 'Confirmed' },
  { id: 'TXN-90411', pupil: 'Sarah A. · JSS 2', amount: '₦185,000', method: 'Card', date: '01 Oct 2026', status: 'Confirmed' },
  { id: 'TXN-90410', pupil: 'Grace N. · JSS 3', amount: '₦60,000', method: 'Cash · office', date: '30 Sep 2026', status: 'Pending' },
];

export const AdminFeesPage = () => (
  <div className="space-y-6">
    <PageHeader eyebrow="Finance" title="Fees & payments" text="Invoices, collections, reminders and receipts for the whole school." actions={<button type="button" className="inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">+ Raise invoice</button>} />
    <div className="grid gap-4 sm:grid-cols-4">
      <StatTile label="Expected (Term)" value="₦62.0M" hint="All programmes" />
      <StatTile label="Collected" value="₦48.2M" hint="78% · +₦3.1M this week" />
      <StatTile label="Outstanding" value="₦13.8M" hint="96 defaulters" />
      <StatTile label="Overdue > 30d" value="₦4.1M" hint="Escalate to office" />
    </div>
    <Card>
      <CardHead title="Recent transactions" sub="Receipts and confirmations" />
      <TableWrap>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead><tr><Th>Reference</Th><Th>Pupil</Th><Th>Amount</Th><Th>Method · Date</Th><Th>Status</Th></tr></thead>
          <tbody>
            {txns.map((t) => (
              <tr key={t.id}>
                <Td className="font-bold">{t.id}</Td><Td>{t.pupil}</Td><Td className="font-extrabold text-brand-700">{t.amount}</Td>
                <Td className="text-muted">{t.method} · {t.date}</Td>
                <Td><Pill tone={t.status === 'Confirmed' ? 'emerald' : 'amber'}>{t.status}</Pill></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      <div className="flex flex-wrap gap-2 border-t border-line px-5 py-4">
        <button type="button" className="rounded bg-brand-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-brand-700">Send reminders (96)</button>
        <button type="button" className="rounded border border-line px-4 py-2.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700">Export ledger</button>
      </div>
    </Card>
  </div>
);
