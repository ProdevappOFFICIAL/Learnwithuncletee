import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';

interface AssignmentRow {
  id: string;
  title: string;
  subject: string;
  className: string;
  dueAt: string;
  maxScore: number;
  teacher: { user_name: string };
  _count: { submissions: number };
}

export const AdminAssignmentsPage = () => {
  const { data, loading, error, reload } = useResource<AssignmentRow[]>('/school-assignments', { limit: 50 });

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Academics" title="Assignments monitor" text="Workload and completion across all classes." />
      <Card>
        <CardHead title="All assignments" sub="Every class · every teacher" />
        {loading ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={5} /></div>
        ) : error || !data ? (
          <div className="px-5 py-5"><ErrorState message={error ?? 'No data'} onRetry={reload} /></div>
        ) : data.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message="No assignments yet." /></div>
        ) : (
          <TableWrap>
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead><tr><Th>Title</Th><Th>Teacher · Class</Th><Th>Due</Th><Th>Submissions</Th></tr></thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.id}>
                    <Td><span className="font-bold">{r.title}</span><span className="block text-xs text-muted">{r.subject} · {r.maxScore} marks</span></Td>
                    <Td className="text-muted">{r.teacher.user_name} · {r.className}</Td>
                    <Td>{new Date(r.dueAt).toLocaleDateString()}</Td>
                    <Td className="font-bold">{r._count.submissions}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </Card>
    </div>
  );
};
