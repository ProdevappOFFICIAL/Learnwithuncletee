import { Card, CardHead, PageHeader, Pill, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';

const classes = [
  { name: 'JSS 2 Diamond', pupils: 42, subject: 'Mathematics', time: 'Mon – Fri · 8:00 AM', room: 'Block B · Room 4', next: 'Today 4:00 PM · Live revision' },
  { name: 'JSS 1 Gold', pupils: 40, subject: 'Mathematics', time: 'Mon – Thu · 10:00 AM', room: 'Block A · Room 2', next: 'Wed 10:00 AM' },
  { name: 'JSS 3 Emerald', pupils: 46, subject: 'Mathematics', time: 'Tue – Fri · 9:20 AM', room: 'Block C · Room 1', next: 'Fri 9:20 AM' },
  { name: 'JSS 2 Diamond (Clinic)', pupils: 18, subject: 'Maths Clinic', time: 'Saturdays · 9:00 AM', room: 'ICT Centre', next: 'Sat 9:00 AM' },
];

export const TeacherClassesPage = () => (
  <div className="space-y-6">
    <PageHeader eyebrow="My classes" title="My classes" text="Timetable, pupil lists and live-class controls for each assigned class." />
    <Card>
      <CardHead title="Assigned classes" sub="2026/27 session" />
      <TableWrap>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead><tr><Th>Class</Th><Th>Schedule</Th><Th>Next lesson</Th><Th>Action</Th></tr></thead>
          <tbody>
            {classes.map((c) => (
              <tr key={c.name}>
                <Td><span className="font-bold">{c.name}</span><span className="block text-xs text-muted">{c.pupils} pupils · {c.subject} · {c.room}</span></Td>
                <Td>{c.time}</Td>
                <Td><Pill tone="sky">{c.next}</Pill></Td>
                <Td>
                  <span className="flex gap-2">
                    <button type="button" className="rounded bg-brand-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700">Start live</button>
                    <button type="button" className="rounded border border-line px-3 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700">Pupils</button>
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </Card>
  </div>
);
