import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { studentAssignments, studentOverview, virtualClasses } from '@/data/dashboard';
import { BannerCard, Card, CardHead, PageHeader, Pill, StatTile, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';

export const StudentDashboardPage = () => (
  <div className="space-y-6">
    <PageHeader
      eyebrow="Student dashboard"
      title="Welcome back, Daniel 👋"
      text="Here is your school day at a glance — classes, assignments and fees."
      actions={
        <>
          <Link to={ROUTES.studentVirtualClass} className="inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
            Join live class
          </Link>
          <Link to={ROUTES.studentAssignments} className="inline-flex min-h-11 items-center rounded border border-line bg-white px-5 py-2.5 text-sm font-bold text-ink hover:border-brand-500 hover:text-brand-700">
            View assignments
          </Link>
        </>
      }
    />

    <BannerCard
      eyebrow="First term · 2026/27"
      title="Your school day, connected."
      text="JSS 2 Diamond · Class teacher Mrs. Okoye · 96% attendance this term. Keep up the excellent work!"
      image="/school.JPG"
    />

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {studentOverview.stats.map((s) => <StatTile key={s.id} label={s.label} value={s.value} hint={s.hint} />)}
    </div>

    <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
      <Card>
        <CardHead title="Today's timetable" sub="Tuesday · JSS 2 Diamond" link={{ to: ROUTES.studentVirtualClass, label: 'Full timetable' }} />
        <TableWrap>
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead><tr><Th>Time</Th><Th>Subject</Th><Th>Teacher</Th></tr></thead>
            <tbody>
              {studentOverview.timetable.map((row) => (
                <tr key={row.time}>
                  <Td className="font-bold text-brand-700">{row.time}</Td>
                  <Td><span className="font-bold">{row.subject}</span><span className="block text-xs text-muted">{row.room}</span></Td>
                  <Td className="text-muted">{row.teacher}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Card>

      <Card>
        <CardHead title="Up next" sub="Assignments due soon" link={{ to: ROUTES.studentAssignments, label: 'View all' }} />
        <ul className="divide-y divide-line">
          {studentAssignments.slice(0, 3).map((a) => (
            <li key={a.id} className="flex items-start justify-between gap-3 px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-brand-700">{a.subject}</p>
                <p className="mt-1 text-sm font-bold">{a.title}</p>
                <p className="mt-0.5 text-xs text-muted">Due {a.due} · {a.teacher}</p>
              </div>
              <Pill tone={a.status === 'Pending' ? 'amber' : 'emerald'}>{a.status.split(' ')[0]}</Pill>
            </li>
          ))}
        </ul>
      </Card>
    </div>

    <Card>
      <CardHead title="Upcoming live classes" sub="Virtual classroom schedule" link={{ to: ROUTES.studentVirtualClass, label: 'Open virtual class' }} />
      <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
        {virtualClasses.map((v) => (
          <article key={v.id} className="overflow-hidden border border-line">
            <div className="h-28 bg-brand-900" style={{ backgroundImage: `linear-gradient(90deg, rgba(4,58,33,.75), rgba(4,58,33,.25)), url(${v.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div className="p-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-brand-700">{v.subject}</p>
              <h4 className="mt-1 font-display text-sm font-extrabold">{v.topic}</h4>
              <p className="mt-1 text-xs text-muted">{v.time} · {v.duration}</p>
            </div>
          </article>
        ))}
      </div>
    </Card>
  </div>
);
