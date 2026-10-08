import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { useAuth, useResource } from '@/context/AuthContext';
import { BannerCard, Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pill, StatTile } from '@/components/dashboard/DashboardUI';
import { activeConduct, useMyConduct } from './StudentConductPage';
import { ShieldAlert } from 'lucide-react';

interface StudentOverview {
  profile: { className: string; studentCode: string } | null;
  stats: Array<{ id: string; label: string; value: string; hint?: string }>;
  upcomingAssignments: Array<{ id: string; subject: string; title: string; dueAt: string; teacher: string }>;
  liveClasses: Array<{ id: string; subject: string; topic: string; startsAt: string; durationMins: number; status: string; teacher: string }>;
}

export const StudentDashboardPage = () => {
  const { user } = useAuth();
  const { data, loading, error, reload } = useResource<StudentOverview>('/dashboard/student');
  const conduct = useMyConduct();
  const live = activeConduct(conduct.data?.data ?? []);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student dashboard"
        title={`Welcome back, ${user?.user_name?.split(' ')[0] ?? 'student'} 👋`}
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

      {loading ? (
        <LoadingSkeleton rows={6} />
      ) : error || !data ? (
        <ErrorState message={error ?? 'No data'} onRetry={reload} />
      ) : (
        <>
          <BannerCard
            eyebrow="First term · 2026/27"
            title="Your school day, connected."
            text={`${data.profile?.className ?? 'Your class'} · ${data.profile?.studentCode ?? ''} · Keep up the excellent work!`}
            image="/school.JPG"
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.stats.map((s) => <StatTile key={s.id} label={s.label} value={s.value} hint={s.hint} />)}
          </div>

          {/* Conduct strip — access decision: pupils always keep Results /
              Assignments / Virtual Class open; active actions only show here
              and on the Conduct page until the office lifts them. */}
          {!conduct.isPending && !conduct.isError && (
            live.length > 0 ? (
              <Card className="border-rose-300">
                <Link to={ROUTES.studentConduct} className="flex items-start gap-3 px-5 py-4">
                  <ShieldAlert aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-rose-700" />
                  <span>
                    <span className="block text-sm font-extrabold text-rose-800">
                      {live.length} active discipline action{live.length === 1 ? '' : 's'} — view your conduct record →
                    </span>
                    <span className="mt-1 block text-xs text-muted">Your classes and results stay accessible while this is resolved.</span>
                  </span>
                </Link>
              </Card>
            ) : (
              <Card className="border-lime-accent">
                <Link to={ROUTES.studentConduct} className="flex items-center gap-3 px-5 py-3">
                  <ShieldAlert aria-hidden="true" size={18} className="shrink-0 text-emerald-700" />
                  <span className="text-sm"><b className="text-emerald-800">Good conduct</b> <span className="text-muted">— no active actions. View record →</span></span>
                </Link>
              </Card>
            )
          )}

          <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
            <Card>
              <CardHead title="Up next" sub="Assignments due soon" link={{ to: ROUTES.studentAssignments, label: 'View all' }} />
              {data.upcomingAssignments.length === 0 ? (
                <p className="px-5 py-6 text-sm text-muted"><EmptyState message="No pending assignments. Enjoy the break!" /></p>
              ) : (
                <ul className="divide-y divide-line">
                  {data.upcomingAssignments.map((a) => (
                    <li key={a.id} className="flex items-start justify-between gap-3 px-5 py-4">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-brand-700">{a.subject}</p>
                        <p className="mt-1 text-sm font-bold">{a.title}</p>
                        <p className="mt-0.5 text-xs text-muted">Due {new Date(a.dueAt).toLocaleDateString()} · {a.teacher}</p>
                      </div>
                      <Pill tone="amber">Pending</Pill>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <CardHead title="Live classes" sub="Virtual classroom" link={{ to: ROUTES.studentVirtualClass, label: 'Open virtual class' }} />
              {data.liveClasses.length === 0 ? (
                <div className="px-5 py-5"><EmptyState message="No live classes scheduled yet." /></div>
              ) : (
                <ul className="divide-y divide-line">
                  {data.liveClasses.map((v) => (
                    <li key={v.id} className="px-5 py-4">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-brand-700">{v.subject} · {v.teacher}</p>
                      <h4 className="mt-1 font-display text-sm font-extrabold">{v.topic}</h4>
                      <p className="mt-1 text-xs text-muted">{new Date(v.startsAt).toLocaleString()} · {v.durationMins} mins</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
