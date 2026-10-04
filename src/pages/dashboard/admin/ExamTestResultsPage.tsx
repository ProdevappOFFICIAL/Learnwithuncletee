import { useState } from 'react';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pill, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { apiDelete } from '@/lib/api';

interface TestResultRow {
  id: string;
  overallScore: number;
  attempted_questions: number;
  total_questions: number;
  date: string;
  user?: { user_name: string; user_email: string };
  exam?: { exam_name: string };
}

export const ExamTestResultsPage = () => {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const { data, loading, error, reload } = useResource<TestResultRow[]>('/results', { searchTerm: query, limit: 100 });
  const [notice, setNotice] = useState<string | null>(null);

  const remove = async (row: TestResultRow) => {
    if (!confirm(`Delete the test result of ${row.user?.user_name ?? 'this pupil'} for "${row.exam?.exam_name ?? 'this exam'}"? This cannot be undone.`)) return;
    try {
      await apiDelete(`/results/${row.id}`);
      setNotice('Test result deleted.');
      reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Exam & Test"
        title="Test Results"
        text="Overall scores from pupils sitting exams on the platform. Report-sheet PDFs live under Results."
      />
      {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

      <Card>
        <CardHead title="All attempts" sub="Newest first" />
        <form
          className="flex flex-wrap gap-2 border-b border-line px-5 py-4"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search);
          }}
        >
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pupil or exam…"
            aria-label="Search test results"
            className="min-h-11 w-full max-w-xs rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500"
          />
          <button type="submit" className="min-h-11 rounded bg-brand-900 px-4 text-sm font-bold text-white hover:bg-brand-700">Search</button>
        </form>
        {loading ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={5} /></div>
        ) : error || !data ? (
          <div className="px-5 py-5"><ErrorState message={error ?? 'No data'} onRetry={reload} /></div>
        ) : data.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message="No test attempts recorded yet." /></div>
        ) : (
          <TableWrap>
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead><tr><Th>Pupil</Th><Th>Exam</Th><Th>Score</Th><Th>Attempted</Th><Th>Date</Th><Th><span className="sr-only">Actions</span></Th></tr></thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.id}>
                    <Td><span className="font-bold">{r.user?.user_name ?? '—'}</span><span className="block text-xs text-muted">{r.user?.user_email ?? ''}</span></Td>
                    <Td>{r.exam?.exam_name ?? '—'}</Td>
                    <Td><Pill tone={r.overallScore >= 75 ? 'emerald' : r.overallScore < 40 ? 'rose' : 'sky'}>{r.overallScore}%</Pill></Td>
                    <Td className="text-muted">{r.attempted_questions}/{r.total_questions}</Td>
                    <Td className="text-muted">{new Date(r.date).toLocaleDateString()}</Td>
                    <Td><button type="button" onClick={() => remove(r)} className="rounded border border-line px-3 py-1.5 text-xs font-bold text-rose-700 hover:border-rose-300">Delete</button></Td>
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
