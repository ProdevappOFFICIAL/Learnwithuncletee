import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pill } from '@/components/dashboard/DashboardUI';
import { apiGet } from '@/lib/api';
import { LIST_STALE } from '@/lib/pagedQuery';
import { ROUTES } from '@/routes/paths';
import type { DisciplineActionItem } from '@/data/dashboard';
import { ShieldAlert } from 'lucide-react';

/**
 * Pupil-facing conduct record — read-only. The API scopes pupils to their own
 * rows regardless of query params; there is no lift/delete UI here on purpose.
 */
export const useMyConduct = () =>
  useQuery({
    queryKey: ['my-conduct'],
    queryFn: () => apiGet<DisciplineActionItem[]>('/discipline'),
    staleTime: LIST_STALE,
  });

export const activeConduct = (list: DisciplineActionItem[]) => list.filter((d) => d.status !== 'LIFTED');

export const StudentConductPage = () => {
  const conduct = useMyConduct();
  const list = conduct.data?.data ?? [];
  const live = activeConduct(list);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Student portal"
        title="My conduct"
        text="Discipline records on your file. Speak to the school office if anything looks wrong."
      />
      {live.length > 0 && (
        <Card className="border-rose-300">
          <div className="flex items-start gap-3 px-5 py-4">
            <ShieldAlert aria-hidden="true" size={20} className="mt-0.5 shrink-0 text-rose-700" />
            <div>
              <p className="text-sm font-extrabold text-rose-800">
                You have {live.length} active action{live.length === 1 ? '' : 's'}: {live.map((d) => d.action).join(' · ')}
              </p>
              <p className="mt-1 text-xs text-muted">Your access to exams and results stays open — the office lifts actions once resolved.</p>
            </div>
          </div>
        </Card>
      )}
      <Card>
        <CardHead title="Record history" sub={`${list.length} entr${list.length === 1 ? 'y' : 'ies'}`} />
        {conduct.isPending ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={3} /></div>
        ) : conduct.isError ? (
          <div className="px-5 py-5"><ErrorState message="Could not load your conduct record" onRetry={() => conduct.refetch()} /></div>
        ) : list.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message="Clean slate — no discipline records on your file. Keep it that way! 🎉" /></div>
        ) : (
          <ul className="divide-y divide-line">
            {list.map((d) => (
              <li key={d.id} className="px-5 py-4">
                <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
                  {d.action}
                  <Pill tone={d.status === 'LIFTED' ? 'emerald' : 'rose'}>{d.status === 'LIFTED' ? 'Lifted' : 'Active'}</Pill>
                </p>
                {d.reason && <p className="mt-1 text-sm text-muted">{d.reason}</p>}
                <p className="mt-1 text-xs text-muted">{new Date(d.createdAt).toLocaleDateString()}</p>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <p className="text-sm text-muted">
        <Link to={ROUTES.studentDashboard} className="font-bold text-brand-700 hover:text-brand-500">← Back to dashboard</Link>
      </p>
    </div>
  );
};
