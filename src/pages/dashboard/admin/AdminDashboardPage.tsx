import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ROUTES } from '@/routes/paths';
import { apiGet } from '@/lib/api';
import { LIST_GC } from '@/lib/pagedQuery';
import { BannerCard, Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, StatTile } from '@/components/dashboard/DashboardUI';

interface AdminOverview {
  stats: Array<{ id: string; label: string; value: string; hint?: string }>;
  latestNotices: Array<{ id: string; title: string; category: string }>;
}

export const AdminDashboardPage = () => {
  // School snapshot: fresh for 2 minutes, kept 30 — navigating away and back
  // never refetches within the window.
  const overview = useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => apiGet<AdminOverview>('/dashboard/admin'),
    staleTime: 2 * 60 * 1000,
    gcTime: LIST_GC,
  });
  const data = overview.data?.data;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin dashboard"
        title="School at a glance 🏫"
        text="Admissions, fees, staffing and academics — everything that needs your attention today."
        actions={
          <>
            <Link to={ROUTES.adminAdmissions} className="hidden min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
              Review admissions
            </Link>
            <Link to={ROUTES.adminNews} className="inline-flex min-h-11 items-center rounded bg-brand-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
              Post announcement
            </Link>
          </>
        }
      />

      {overview.isPending ? (
        <LoadingSkeleton rows={6} />
      ) : overview.isError || !data ? (
        <ErrorState message="Could not load overview" onRetry={() => overview.refetch()} />
      ) : (
        <>
          <BannerCard
            eyebrow="2026/27 session"
            title="One view of the whole school."
            text="Live enrolment, collections and grading queue below — all pulled from the database."
            image="/students_playing_games.jfif"
            action={
              <Link to={ROUTES.adminExams} className="inline-flex min-h-11 items-center rounded bg-lime-accent px-5 py-2.5 text-sm font-bold text-brand-900">View Exam & Test</Link>
            }
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.stats.map((s) => <StatTile key={s.id} label={s.label} value={s.value} hint={s.hint} />)}
          </div>

          <Card>
            <CardHead title="Latest announcements" sub="School-wide feed" link={{ to: ROUTES.adminNews, label: 'Manage news' }} />
            {data.latestNotices.length === 0 ? (
              <div className="px-5 py-5"><EmptyState message="No announcements yet." /></div>
            ) : (
              <ul className="divide-y divide-line">
                {data.latestNotices.map((n) => (
                  <li key={n.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                    <p className="text-sm font-bold">{n.title}</p>
                    <span className="text-xs text-muted">{n.category}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
};
