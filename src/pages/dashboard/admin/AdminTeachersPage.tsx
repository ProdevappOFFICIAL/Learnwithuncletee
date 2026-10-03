import { Card, CardHead, PageHeader, Pill, StatTile, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';

const staff = [
  { name: 'Mr. Balogun', role: 'Mathematics · HOD Sciences', classes: 'JSS 1–3 · 128 pupils', status: 'Active', load: '18 periods/wk' },
  { name: 'Mrs. Okoye', role: 'English · Class teacher JSS 2', classes: 'JSS 2 Diamond', status: 'Active', load: '16 periods/wk' },
  { name: 'Miss Ibrahim', role: 'Basic Science · Lab lead', classes: 'JSS 1–2', status: 'On leave', load: '12 periods/wk' },
  { name: 'Mr. Eze', role: 'ICT · Virtual class lead', classes: 'All arms', status: 'Active', load: '14 periods/wk' },
];

export const AdminTeachersPage = () => (
  <div className="space-y-6">
    <PageHeader
      eyebrow="Teachers & staff"
      title="Teachers & staff"
      text="Roles, workload, leave and performance across teaching and non-teaching staff."
      actions={<button type="button" className="inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">+ Add staff</button>}
    />
    <div className="grid gap-4 sm:grid-cols-4">
      <StatTile label="Teaching staff" value="62" hint="Across 3 programmes" />
      <StatTile label="Non-teaching" value="23" hint="Admin · drivers · support" />
      <StatTile label="On leave" value="3" hint="Cover assigned" />
      <StatTile label="Open roles" value="6" hint="Recruiting" />
    </div>
    <Card>
      <CardHead title="Staff directory" sub="Assignments and status" />
      <TableWrap>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead><tr><Th>Staff</Th><Th>Classes</Th><Th>Workload</Th><Th>Status</Th></tr></thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.name}>
                <Td><span className="font-bold">{s.name}</span><span className="block text-xs text-muted">{s.role}</span></Td>
                <Td>{s.classes}</Td><Td>{s.load}</Td>
                <Td><Pill tone={s.status === 'Active' ? 'emerald' : 'amber'}>{s.status}</Pill></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </Card>
  </div>
);
