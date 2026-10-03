import { Card, CardHead, PageHeader, Pill, StatTile, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';

export const AdminResultsPage = () => (
  <div className="space-y-6">
    <PageHeader eyebrow="Academics" title="Results oversight" text="Approve, publish and compare performance across classes and terms." actions={<button type="button" className="inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">Publish term results</button>} />
    <div className="grid gap-4 sm:grid-cols-4">
      <StatTile label="Classes submitted" value="18 / 24" hint="6 awaiting HOD sign-off" />
      <StatTile label="School average" value="78.6%" hint="+1.4% vs last term" />
      <StatTile label="Top class" value="JSS 2" hint="83.0% average" />
      <StatTile label="Pending approval" value="6" hint="Review broadsheets" />
    </div>
    <Card>
      <CardHead title="Broadsheet approvals" sub="Second Term 2025/26" />
      <TableWrap>
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead><tr><Th>Class</Th><Th>Submitted by</Th><Th>Average</Th><Th>Status</Th></tr></thead>
          <tbody>
            {[
              { c: 'JSS 2 Diamond', by: 'Mrs. Okoye', avg: '83.0%', s: 'Ready to publish' },
              { c: 'JSS 1 Gold', by: 'Mr. Eze', avg: '76.4%', s: 'Ready to publish' },
              { c: 'JSS 3 Emerald', by: 'Miss Ibrahim', avg: '79.8%', s: 'Needs correction' },
            ].map((r) => (
              <tr key={r.c}>
                <Td className="font-bold">{r.c}</Td><Td className="text-muted">{r.by}</Td><Td className="font-bold text-brand-700">{r.avg}</Td>
                <Td><Pill tone={r.s === 'Ready to publish' ? 'emerald' : 'amber'}>{r.s}</Pill></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </Card>
  </div>
);
