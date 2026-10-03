import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { useAuth, useResource } from '@/context/AuthContext';
import { BannerCard, Card, CardHead, ErrorState, LoadingSkeleton, PageHeader, Pill, StatTile, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';

interface TeacherOverview {
  stats: Array<{ id: string; label: string; value: string; hint?: string }>;
  assignments: Array<{ id: string; title: string; subject: string; className: string; dueAt: string; submitted: number }>;
  upcomingLessons: Array<{ id: string; topic: string; subject: string; startsAt: string }>;
}

export const TeacherDashboardPage = () => {
  const { user } = useAuth();
  const { data, loading, error, reload } = useResource<TeacherOverview>('/dashboard/teacher');

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Teacher dashboard"
        title={`Good day, ${user?.user_name ?? 'teacher'} 👋`}
        text="Your classes, grading queue and live lessons at a glance."
        actions={
          <>
            <Link to={ROUTES.teacherAssignments} className="inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
              Grade submissions
            </Link>
            <Link to={ROUTES.teacherClasses} className="inline-flex min-h-11 items-center rounded border border-line bg-white px-5 py-2.5 text-sm font-bold text-ink hover:border-brand-500 hover:text-brand-700">
              My classes
            </Link>
          </>
        }
      />

      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : error || !data ? (
        <ErrorState message={error ?? 'No data'} onRetry={reload} />
      ) : (
        <>
          <BannerCard
            eyebrow="Today"
            title={data.upcomingLessons[0] ? `Next live: ${data.upcomingLessons[0].topic}` : 'No live class scheduled today'}
            text={data.upcomingLessons[0] ? `${data.upcomingLessons[0].subject} · ${new Date(data.upcomingLessons[0].startsAt).toLocaleString()}` : 'Schedule your next lesson from the assignments or classes page.'}
            image="/academics.jpeg"
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.stats.map((s) => <StatTile key={s.id} label={s.label} value={s.value} hint={s.hint} />)}
          </div>

          <Card>
            <CardHead title="Recent assignments" sub="Your active classwork" link={{ to: ROUTES.teacherAssignments, label: 'Open assignments' }} />
            <TableWrap>
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead><tr><Th>Title</Th><Th>Class</Th><Th>Due</Th><Th>Submitted</Th></tr></thead>
                <tbody>
                  {data.assignments.map((a) => (
                    <tr key={a.id}>
                      <Td><span className="font-bold">{a.title}</span><span className="block text-xs text-muted">{a.subject}</span></Td>
                      <Td>{a.className}</Td>
                      <Td>{new Date(a.dueAt).toLocaleDateString()}</Td>
                      <Td><Pill tone="sky">{a.submitted}</Pill></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </Card>
        </>
      )}
    </div>
  );
};
