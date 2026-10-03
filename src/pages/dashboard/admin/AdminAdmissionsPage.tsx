import { Card, CardHead, PageHeader, Pill, StatTile, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';

const apps = [
  { name: 'Adaeze N.', klass: 'JSS 1', stage: 'Interview today · 9:00 AM', status: 'Interview' },
  { name: 'Ibrahim S.', klass: 'Primary 4', stage: 'Birth cert + report pending', status: 'Documents' },
  { name: 'Funke A.', klass: 'Creche', stage: 'Offer accepted · fees due', status: 'Offer sent' },
  { name: 'Tunde B.', klass: 'SS 1', stage: 'Entrance scored 78%', status: 'Review' },
];

export const AdminAdmissionsPage = () => (
  <div className="space-y-6">
    <PageHeader eyebrow="Admissions" title="Admissions pipeline" text="From enquiry to enrolment — interviews, offers and documents in one queue." actions={<button type="button" className="inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">+ New application</button>} />
    <div className="grid gap-4 sm:grid-cols-4">
      <StatTile label="New enquiries" value="58" hint="This month" />
      <StatTile label="Interviews today" value="5" hint="Hall B · from 9 AM" />
      <StatTile label="Offers sent" value="17" hint="11 accepted" />
      <StatTile label="Enrolled" value="31" hint="2026/27 session" />
    </div>
    <Card>
      <CardHead title="Application queue" sub="24 active applications" />
      <TableWrap>
        <table className="w-full min-w-[680px] text-left text-sm">
          <thead><tr><Th>Applicant</Th><Th>Class sought</Th><Th>Stage</Th><Th>Status</Th></tr></thead>
          <tbody>
            {apps.map((a) => (
              <tr key={a.name}>
                <Td className="font-bold">{a.name}</Td><Td>{a.klass}</Td><Td className="text-muted">{a.stage}</Td>
                <Td><Pill tone={a.status === 'Offer sent' ? 'emerald' : 'amber'}>{a.status}</Pill></Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </Card>
  </div>
);
