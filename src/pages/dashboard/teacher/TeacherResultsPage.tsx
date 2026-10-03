import { Card, CardHead, PageHeader, Pill, StatTile, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';

const classResults = [
  { pupil: 'Daniel E.', ca: 28, exam: 62, total: 90, grade: 'A' },
  { pupil: 'Sarah A.', ca: 27, exam: 60, total: 87, grade: 'A' },
  { pupil: 'Michael O.', ca: 24, exam: 55, total: 79, grade: 'B' },
  { pupil: 'Grace N.', ca: 26, exam: 58, total: 84, grade: 'B' },
  { pupil: 'David F.', ca: 22, exam: 50, total: 72, grade: 'C' },
];

export const TeacherResultsPage = () => (
  <div className="space-y-6">
    <PageHeader
      eyebrow="Results"
      title="Results & grading"
      text="Enter CA and exam scores. Totals, grades and positions are computed automatically."
      actions={
        <>
          <button type="button" className="inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">Enter scores</button>
          <button type="button" className="inline-flex min-h-11 items-center rounded border border-line bg-white px-5 py-2.5 text-sm font-bold hover:border-brand-500 hover:text-brand-700">Publish results</button>
        </>
      }
    />

    <div className="grid gap-4 sm:grid-cols-4">
      <StatTile label="Class average" value="81%" hint="JSS 2 Diamond · Maths" />
      <StatTile label="Highest" value="90%" hint="Daniel E." />
      <StatTile label="Pass rate" value="100%" hint="42 / 42 pupils" />
      <StatTile label="Pending entries" value="4" hint="CA scores missing" />
    </div>

    <Card>
      <CardHead title="JSS 2 Diamond — Mathematics" sub="Second Term 2025/26 · CA 30 + Exam 70" />
      <TableWrap>
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead><tr><Th>Pupil</Th><Th>CA / 30</Th><Th>Exam / 70</Th><Th>Total / 100</Th><Th>Grade</Th><Th>Action</Th></tr></thead>
          <tbody>
            {classResults.map((r) => (
              <tr key={r.pupil}>
                <Td className="font-bold">{r.pupil}</Td>
                <Td>{r.ca}</Td>
                <Td>{r.exam}</Td>
                <Td className="font-extrabold text-brand-700">{r.total}</Td>
                <Td><Pill tone={r.grade === 'A' ? 'emerald' : r.grade === 'B' ? 'sky' : 'amber'}>{r.grade}</Pill></Td>
                <Td><button type="button" className="rounded border border-line px-3 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700">Edit</button></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
      <p className="border-t border-line bg-brand-50/60 px-5 py-3 text-xs text-muted">Scores are draft until published by the academic office. Sample data for layout.</p>
    </Card>
  </div>
);
