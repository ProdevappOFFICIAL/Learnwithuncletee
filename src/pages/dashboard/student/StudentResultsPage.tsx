import { Card, CardHead, PageHeader, Pill, StatTile, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';
import { studentResults } from '@/data/dashboard';

export const StudentResultsPage = () => (
  <div className="space-y-6">
    <PageHeader
      eyebrow="Results"
      title="Academic results"
      text="Second Term 2025/26 · JSS 2 Diamond · Class position: 3rd of 42. Published by the academic office."
      actions={
        <button type="button" className="inline-flex min-h-11 items-center rounded bg-brand-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
          Download report card
        </button>
      }
    />

    <div className="grid gap-4 sm:grid-cols-4">
      <StatTile label="Term average" value="83.0%" hint="A · Excellent" />
      <StatTile label="Position" value="3rd" hint="of 42 pupils" />
      <StatTile label="Subjects" value="6" hint="All passed" />
      <StatTile label="Attendance" value="96%" hint="144 / 150 days" />
    </div>

    <Card>
      <CardHead title="Subject breakdown" sub="CA (30) + Exam (70) = Total (100)" />
      <TableWrap>
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead><tr><Th>Subject</Th><Th>CA / 30</Th><Th>Exam / 70</Th><Th>Total / 100</Th><Th>Grade</Th><Th>Remark</Th></tr></thead>
          <tbody>
            {studentResults.map((r) => (
              <tr key={r.subject}>
                <Td className="font-bold">{r.subject}</Td>
                <Td>{r.ca}</Td>
                <Td>{r.exam}</Td>
                <Td className="font-extrabold text-brand-700">{r.total}</Td>
                <Td><Pill tone={r.grade === 'A' ? 'emerald' : r.grade === 'B' ? 'sky' : 'amber'}>{r.grade}</Pill></Td>
                <Td className="text-muted">{r.remark}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      <div className="grid gap-4 border-t border-line bg-cream px-5 py-4 text-sm sm:grid-cols-2">
        <p><span className="font-bold">Class teacher's remark:</span> <span className="text-muted">An excellent term. Keep up the focus and neat presentation.</span></p>
        <p><span className="font-bold">Principal's remark:</span> <span className="text-muted">Promoted to JSS 3 pending final approval.</span></p>
      </div>
    </Card>
  </div>
);
