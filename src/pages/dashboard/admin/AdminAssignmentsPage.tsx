import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { apiDelete } from '@/lib/api';

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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const remove = async (row: AssignmentRow) => {
    const submissions = row._count.submissions;
    const warning = submissions > 0
      ? ` This also deletes ${submissions} submission${submissions === 1 ? '' : 's'}.`
      : '';
    if (!window.confirm(`Delete “${row.title}”?${warning} This cannot be undone.`)) return;
    setDeletingId(row.id);
    setNotice(null);
    try {
      await apiDelete(`/school-assignments/${row.id}`);
      setNotice('Assignment deleted.');
      reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Academics" title="Assignments monitor" text="Workload and completion across all classes." />
      {notice && (
        <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">
          {notice}
        </p>
      )}
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
              <thead><tr><Th>Title</Th><Th>Teacher · Class</Th><Th>Due</Th><Th>Submissions</Th><Th>Actions</Th></tr></thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.id}>
                    <Td><span className="font-bold">{r.title}</span><span className="block text-xs text-muted">{r.subject} · {r.maxScore} marks</span></Td>
                    <Td className="text-muted">{r.teacher.user_name} · {r.className}</Td>
                    <Td>{new Date(r.dueAt).toLocaleDateString()}</Td>
                    <Td className="font-bold">{r._count.submissions}</Td>
                    <Td>
                      <button
                        type="button"
                        onClick={() => remove(r)}
                        disabled={deletingId === r.id}
                        className="inline-flex items-center gap-1 rounded border border-rose-200 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={12} aria-hidden="true" />
                        {deletingId === r.id ? 'Deleting…' : 'Delete'}
                      </button>
                    </Td>
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
