import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { teacherOverview } from '@/data/dashboard';
import { BannerCard, Card, CardHead, PageHeader, Pill, StatTile, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';

export const TeacherDashboardPage = () => (
  <div className="space-y-6">
    <PageHeader
      eyebrow="Teacher dashboard"
      title="Good afternoon, Mr. Balogun 👋"
      text="Mathematics · JSS 1–3 · 4 classes · 128 pupils. 12 scripts waiting for grading."
      actions={
        <>
          <Link to={ROUTES.teacherAssignments} className="inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
            Grade submissions
          </Link>
          <Link to={ROUTES.teacherClasses} className="inline-flex min-h-11 items-center rounded border border-line bg-white px-5 py-2.5 text-sm font-bold text-ink hover:border-brand-500 hover:text-brand-700">
            Start live class
          </Link>
        </>
      }
    />

    <BannerCard
      eyebrow="Next live class · Today 4:00 PM"
      title="JSS 2 Diamond — Quadratic equations revision"
      text="45 mins · 42 pupils expected · Lesson note and whiteboard already attached. Recordings auto-save to the class library."
      image="/academics.jpeg"
    />

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {teacherOverview.stats.map((s) => <StatTile key={s.id} label={s.label} value={s.value} hint={s.hint} />)}
    </div>

    <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
      <Card>
        <CardHead title="Recent submissions" sub="Latest pupil work" link={{ to: ROUTES.teacherAssignments, label: 'Open assignments' }} />
        <TableWrap>
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead><tr><Th>Pupil</Th><Th>Assignment</Th><Th>Status</Th></tr></thead>
            <tbody>
              {teacherOverview.submissions.map((s) => (
                <tr key={s.pupil + s.assignment}>
                  <Td><span className="font-bold">{s.pupil}</span><span className="block text-xs text-muted">{s.class} · {s.time}</span></Td>
                  <Td>{s.assignment}</Td>
                  <Td><Pill tone={s.status.includes('Needs') ? 'amber' : 'emerald'}>{s.status}</Pill></Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Card>

      <Card>
        <CardHead title="This week" sub="Timetable highlights" />
        <ul className="space-y-3 px-5 py-5">
          {[
            { d: 'Tue', t: 'JSS 2 Diamond · Maths · 8:00 AM' },
            { d: 'Tue', t: 'Live revision · 4:00 PM · 45 mins' },
            { d: 'Wed', t: 'JSS 1 Gold · Number bases · 10:00 AM' },
            { d: 'Fri', t: 'JSS 3 Emerald · Simultaneous eqns · 9:20 AM' },
          ].map((item, i) => (
            <li key={i} className="flex gap-3 border border-line p-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-brand-900 font-display text-xs font-extrabold text-lime-accent">{item.d}</span>
              <span className="text-sm font-semibold">{item.t}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  </div>
);
