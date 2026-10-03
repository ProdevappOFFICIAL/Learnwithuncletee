import { Card, CardHead, PageHeader, Pill, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';

export const AdminAssignmentsPage = () => (
  <div className="space-y-6">
    <PageHeader eyebrow="Academics" title="Assignments monitor" text="Workload and completion across all classes. Nudge teachers where work is overdue." />
    <Card>
      <CardHead title="This week's assignments" sub="All subjects · 42 active" />
      <TableWrap>
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead><tr><Th>Title</Th><Th>Teacher · Class</Th><Th>Completion</Th><Th>Status</Th></tr></thead>
          <tbody>
            {[
              { t: 'Quadratic equations — ex 4a', m: 'Mr. Balogun · JSS 2', c: '74%', s: 'Collecting' },
              { t: 'Comprehension + summary', m: 'Mrs. Okoye · JSS 2', c: '88%', s: 'Grading' },
              { t: 'Simple circuits lab report', m: 'Miss Ibrahim · JSS 1', c: '100%', s: 'Graded' },
            ].map((r) => (
              <tr key={r.t}>
                <Td className="font-bold">{r.t}</Td><Td className="text-muted">{r.m}</Td>
                <Td><span className="font-bold">{r.c}</span><span className="mt-1 block h-1.5 w-32 rounded bg-brand-50"><span className="block h-full rounded bg-brand-500" style={{ width: r.c }} /></span></Td>
                <Td><Pill tone={r.s === 'Graded' ? 'emerald' : 'amber'}>{r.s}</Pill></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </Card>
  </div>
);
