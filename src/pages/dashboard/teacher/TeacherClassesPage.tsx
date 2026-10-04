import { useState } from 'react';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pill, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { apiPost } from '@/lib/api';
import type { StudentRow } from '@/data/dashboard';

const CLASSES = ['JSS 2 Diamond', 'JSS 1 Gold', 'JSS 3 Emerald'];

export const TeacherClassesPage = () => {
  const [className, setClassName] = useState(CLASSES[0]);
  const { data, loading, error, reload } = useResource<StudentRow[]>('/students', { className, limit: 100 });
  const [notice, setNotice] = useState<string | null>(null);

  const startLive = async () => {
    setNotice(null);
    try {
      await apiPost('/virtual-lessons', {
        topic: `${className} — live lesson`,
        subject: 'Mathematics',
        className,
        startsAt: new Date(Date.now() + 5 * 60000).toISOString(),
        durationMins: 45,
      });
      setNotice('Live lesson scheduled in 5 minutes. Pupils see it under Virtual Class.');
    } catch (err: any) {
      setNotice(err?.message ?? 'Could not schedule');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="My classes"
        title="My classes"
        text="Pupil lists per class. Start a live lesson any time."
        actions={
          <>
            <select value={className} onChange={(e) => setClassName(e.target.value)} className="min-h-11 rounded border border-line bg-white px-3 text-sm font-bold">
              {CLASSES.map((c) => <option key={c}>{c}</option>)}
            </select>
            <button type="button" onClick={startLive} className="inline-flex min-h-11 items-center rounded bg-brand-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
              Start live
            </button>
          </>
        }
      />

      {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

      <Card>
        <CardHead title={className} sub="Enrolled pupils" />
        {loading ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={5} /></div>
        ) : error || !data ? (
          <div className="px-5 py-5"><ErrorState message={error ?? 'No data'} onRetry={reload} /></div>
        ) : data.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message="No pupils enrolled in this class yet." /></div>
        ) : (
          <TableWrap>
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead><tr><Th>Pupil</Th><Th>Code</Th><Th>Guardian</Th><Th>Fees</Th><Th>Average</Th></tr></thead>
              <tbody>
                {data.map((s) => (
                  <tr key={s.id}>
                    <Td className="font-bold">{s.user_name}</Td>
                    <Td className="text-muted">{s.student?.studentCode ?? '—'}</Td>
                    <Td className="text-muted">{s.student?.guardianName ?? '—'} · {s.student?.guardianPhone ?? ''}</Td>
                    <Td>{s.balanceKobo !== undefined && s.balanceKobo > 0 ? <Pill tone="amber">Owing</Pill> : <Pill tone="emerald">Clear</Pill>}</Td>
                    <Td className="font-bold text-brand-700">{s.average !== null && s.average !== undefined ? `${s.average.toFixed(1)}%` : '—'}</Td>
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
