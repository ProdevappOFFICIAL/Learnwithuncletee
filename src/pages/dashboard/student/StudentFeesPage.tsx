import { BannerCard, Card, CardHead, PageHeader, Pill, StatTile, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';
import { studentFees } from '@/data/dashboard';

export const StudentFeesPage = () => (
  <div className="space-y-6">
    <PageHeader
      eyebrow="Fees"
      title="Fees & payments"
      text="Track invoices, receipts and outstanding balances. Contact Central Admin on +2347039334594 for help."
      actions={
        <button type="button" className="inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
          Pay ₦45,000 now
        </button>
      }
    />

    <div className="grid gap-4 sm:grid-cols-3">
      <StatTile label="Outstanding balance" value="₦45,000" hint="First Term 2026/27 · Due 14 Oct" />
      <StatTile label="Paid this session" value="₦490,000" hint="3 terms settled" />
      <StatTile label="Next due date" value="14 Oct" hint="Avoid late charges" />
    </div>

    <BannerCard
      eyebrow="Pay securely"
      title="First term balance: ₦45,000"
      text="Pay by bank transfer, card or at the school accounts office. Receipts appear here instantly after confirmation."
      image="/img_1.jpeg"
      action={
        <>
          <span className="inline-flex min-h-11 items-center rounded bg-lime-accent px-5 py-2.5 text-sm font-bold text-brand-900">Pay online</span>
          <span className="inline-flex min-h-11 items-center rounded border border-white/50 px-5 py-2.5 text-sm font-bold text-white">Download invoice</span>
        </>
      }
    />

    <Card>
      <CardHead title="Fee history" sub="Invoices and receipts · 2025 – 2026" />
      <TableWrap>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead><tr><Th>Invoice</Th><Th>Term</Th><Th>Amount</Th><Th>Paid</Th><Th>Balance</Th><Th>Status</Th></tr></thead>
          <tbody>
            {studentFees.map((f) => (
              <tr key={f.id}>
                <Td className="font-bold">{f.id}<span className="block text-xs font-medium text-muted">{f.due}</span></Td>
                <Td>{f.term}</Td>
                <Td className="font-semibold">{f.amount}</Td>
                <Td>{f.paid}</Td>
                <Td className="font-bold text-brand-700">{f.balance}</Td>
                <Td><Pill tone={f.status === 'Paid' ? 'emerald' : 'amber'}>{f.status}</Pill></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      <p className="border-t border-line bg-brand-50/60 px-5 py-3 text-xs text-muted">Sample fee figures for layout. Confirm current fees with the accounts office.</p>
    </Card>
  </div>
);
