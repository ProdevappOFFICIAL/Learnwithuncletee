import { Card, CardHead, PageHeader, Pill, StatTile, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';

const rows = [
  { name: 'Daniel E.', id: 'LWU/2024/0312', klass: 'JSS 2 Diamond', guardian: 'Mrs. E. · 0803 111 0001', fees: 'Part paid', avg: '87.4%' },
  { name: 'Sarah A.', id: 'LWU/2024/0307', klass: 'JSS 2 Diamond', guardian: 'Mr. A. · 0803 111 0002', fees: 'Paid', avg: '85.1%' },
  { name: 'Michael O.', id: 'LWU/2025/0410', klass: 'JSS 1 Gold', guardian: 'Mrs. O. · 0803 111 0003', fees: 'Paid', avg: '79.0%' },
  { name: 'Grace N.', id: 'LWU/2023/0255', klass: 'JSS 3 Emerald', guardian: 'Mr. N. · 0803 111 0004', fees: 'Overdue', avg: '84.2%' },
  { name: 'David F.', id: 'LWU/2024/0321', klass: 'JSS 2 Diamond', guardian: 'Mrs. F. · 0803 111 0005', fees: 'Paid', avg: '72.6%' },
];

export const AdminStudentsPage = () => (
  <div className="space-y-6">
    <PageHeader
      eyebrow="Students"
      title="Students"
      text="Enrolment, class allocation, guardians and fee status across all programmes."
      actions={
        <button type="button" className="inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">+ Admit student</button>
      }
    />
    <div className="grid gap-4 sm:grid-cols-4">
      <StatTile label="Total students" value="1,200+" hint="Early Years · Primary · Secondary" />
      <StatTile label="New this term" value="48" hint="+4.2% growth" />
      <StatTile label="Average attendance" value="94%" hint="This week" />
      <StatTile label="Fee defaulters" value="96" hint="Follow-up list ready" />
    </div>
    <Card>
      <CardHead title="Student directory" sub="Search, filter and manage records" />
      <div className="flex flex-wrap gap-2 border-b border-line px-5 py-4">
        <input placeholder="Search name or ID…" className="min-h-11 w-full max-w-xs rounded border border-line px-3 text-sm outline-none focus:border-brand-500" />
        <select className="min-h-11 rounded border border-line bg-white px-3 text-sm"><option>All classes</option><option>JSS 2 Diamond</option><option>JSS 1 Gold</option><option>JSS 3 Emerald</option></select>
        <select className="min-h-11 rounded border border-line bg-white px-3 text-sm"><option>All fee states</option><option>Paid</option><option>Part paid</option><option>Overdue</option></select>
      </div>
      <TableWrap>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead><tr><Th>Pupil</Th><Th>Class</Th><Th>Guardian</Th><Th>Fees</Th><Th>Average</Th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <Td><span className="font-bold">{r.name}</span><span className="block text-xs text-muted">{r.id}</span></Td>
                <Td>{r.klass}</Td><Td className="text-muted">{r.guardian}</Td>
                <Td><Pill tone={r.fees === 'Paid' ? 'emerald' : r.fees === 'Overdue' ? 'rose' : 'amber'}>{r.fees}</Pill></Td>
                <Td className="font-bold text-brand-700">{r.avg}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </Card>
  </div>
);
