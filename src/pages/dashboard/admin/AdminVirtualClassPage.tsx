import { Card, CardHead, PageHeader, Pill, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';

export const AdminVirtualClassPage = () => (
  <div className="space-y-6">
    <PageHeader eyebrow="E-learning" title="Virtual classes" text="Schedule, links, recordings and attendance for online lessons." actions={<button type="button" className="inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">+ Schedule class</button>} />
    <Card>
      <CardHead title="Schedule" sub="This week · Africa/Lagos" />
      <TableWrap>
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead><tr><Th>Topic</Th><Th>Teacher</Th><Th>Time</Th><Th>Status</Th></tr></thead>
          <tbody>
            {[
              { t: 'Quadratic equations revision', m: 'Mr. Balogun · JSS 2', time: 'Tue 4:00 PM · 45 mins', s: 'Live soon' },
              { t: 'Essay writing clinic', m: 'Mrs. Okoye · JSS 2', time: 'Wed 10:00 AM · 60 mins', s: 'Scheduled' },
              { t: 'Spreadsheets practical', m: 'Mr. Eze · JSS 1–3', time: 'Fri 2:00 PM · 50 mins', s: 'Scheduled' },
            ].map((r) => (
              <tr key={r.t}>
                <Td className="font-bold">{r.t}</Td><Td className="text-muted">{r.m}</Td><Td>{r.time}</Td>
                <Td><Pill tone={r.s === 'Live soon' ? 'emerald' : 'sky'}>{r.s}</Pill></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </Card>
  </div>
);
