import { useState } from 'react';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pill, StatTile, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';
import { useAuth, useResource } from '@/context/AuthContext';
import { apiGet } from '@/lib/api';
import { printReportCard } from '@/lib/reportCard';
import { CLASS_OPTIONS, TERM_OPTIONS, sessionOptions, type GradeData, type ResultDocData } from '@/data/dashboard';
import { Download, FileText } from 'lucide-react';

export const StudentResultsPage = () => {
  const { user } = useAuth();
  const sessions = sessionOptions();
  const [className, setClassName] = useState(user?.studentProfile?.className ?? 'JSS 2 Diamond');
  const [session, setSession] = useState('2025/2026');
  const [term, setTerm] = useState('First Term');
  const [mode, setMode] = useState<'exact' | 'all'>('exact');
  const [grades, setGrades] = useState<GradeData[] | null>(null);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // "All results" view loads everything once (for the toggle).
  const allRes = useResource<GradeData[]>('/school-results/mine');
  // Published PDFs for the pupil's own class (server force-scopes by class).
  const docsRes = useResource<ResultDocData[]>('/result-documents', mode === 'exact' ? { session, term } : {});

  const fetchExact = async () => {
    setFetching(true);
    setFetchError(null);
    try {
      const res = await apiGet<GradeData[]>('/school-results/mine', { className, session, term });
      setGrades(res.data);
      setMode('exact');
    } catch (e: any) {
      setFetchError(e?.message ?? 'Could not fetch result');
    } finally {
      setFetching(false);
    }
  };

  const shown = mode === 'exact' ? grades : allRes.data;
  const avg = shown?.length ? shown.reduce((s, g) => s + g.total, 0) / shown.length : 0;

  const downloadPdf = () => {
    if (!shown?.length) return;
    try {
      printReportCard({
        pupilName: user?.user_name ?? 'Pupil',
        studentCode: user?.studentProfile?.studentCode,
        className: mode === 'exact' ? className : (shown[0]?.className ?? ''),
        session: mode === 'exact' ? session : (shown[0]?.session ?? ''),
        term: mode === 'exact' ? term : 'All terms',
        grades: shown,
      });
    } catch (e: any) {
      setFetchError(e?.message ?? 'Could not open report card');
    }
  };

  const selectClass = 'min-h-11 rounded border border-line bg-white px-3 text-sm font-bold';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Results"
        title="Academic results"
        text="Pick your grade, session and term to fetch that exact result — or view everything at once. Only approved results appear here."
        actions={
          shown?.length ? (
            <button type="button" onClick={downloadPdf} className="inline-flex min-h-11 items-center rounded bg-brand-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
              Download PDF
            </button>
          ) : undefined
        }
      />

      <Card className="p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Find result</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <label className="block text-sm font-semibold">Grade (class)
            <select value={className} onChange={(e) => setClassName(e.target.value)} className={`${selectClass} mt-2 w-full`}>
              {CLASS_OPTIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">Session (year)
            <select value={session} onChange={(e) => setSession(e.target.value)} className={`${selectClass} mt-2 w-full`}>
              {sessions.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">Term
            <select value={term} onChange={(e) => setTerm(e.target.value)} className={`${selectClass} mt-2 w-full`}>
              {TERM_OPTIONS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <button type="button" onClick={fetchExact} disabled={fetching} className="min-h-11 rounded bg-brand-500 px-5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
              {fetching ? '…' : 'Fetch result'}
            </button>
            <button type="button" onClick={() => setMode('all')} className="min-h-11 rounded border border-line bg-white px-4 text-sm font-bold hover:border-brand-500 hover:text-brand-700">
              All results
            </button>
          </div>
        </div>
        {fetchError && <p role="alert" className="mt-4 border-l-2 border-rose-400 bg-rose-50 px-4 py-3 text-sm text-rose-800">{fetchError}</p>}
      </Card>

      {mode === 'all' && (allRes.loading ? (
        <LoadingSkeleton rows={5} />
      ) : allRes.error || !allRes.data ? (
        <ErrorState message={allRes.error ?? 'No data'} onRetry={allRes.reload} />
      ) : null)}

      {shown && (
        <>
          <div className="grid gap-4 sm:grid-cols-3 hidden">
            <StatTile label="Average" value={`${avg.toFixed(1)}%`} hint={mode === 'exact' ? `${className} · ${term}` : 'Across all results'} />
            <StatTile label="Subjects" value={String(shown.length)} hint={mode === 'exact' ? session : 'All sessions'} />
            <StatTile label="Top grade" value={shown.length ? [...shown].sort((a, b) => b.total - a.total)[0].grade : '—'} hint="Best subject" />
          </div>

          <Card>
            <CardHead title={mode === 'exact' ? `${className} — ${term}, ${session}` : 'All results'} sub={`${shown.length} subject entr(ies)`} />
            {shown.length === 0 ? (
              <div className="px-5 py-5"><EmptyState message="No published result found for this selection. Check the grade, session and term and try again." /></div>
            ) : (
              <TableWrap>
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead><tr><Th>Subject</Th><Th>CA / 30</Th><Th>Exam / 70</Th><Th>Total / 100</Th><Th>Grade</Th><Th>Remark</Th></tr></thead>
                  <tbody>
                    {shown.map((r) => (
                      <tr key={r.id}>
                        <Td className="font-bold">{r.subject}<span className="block text-xs font-medium text-muted">{r.className} · {r.term} · {r.session}</span></Td>
                        <Td>{r.ca}</Td>
                        <Td>{r.exam}</Td>
                        <Td className="font-extrabold text-brand-700">{r.total}</Td>
                        <Td><Pill tone={r.grade === 'A' ? 'emerald' : r.grade === 'F' ? 'rose' : 'sky'}>{r.grade}</Pill></Td>
                        <Td className="text-muted">{r.remark ?? ''}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            )}
          </Card>
        </>
      )}

      <Card>
        <CardHead title="Result documents" sub="PDFs published by the school for your class" />
        {docsRes.loading ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={2} /></div>
        ) : docsRes.error || !docsRes.data ? (
          <div className="px-5 py-5"><ErrorState message={docsRes.error ?? 'No data'} onRetry={docsRes.reload} /></div>
        ) : docsRes.data.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message="No result PDFs published for you yet." /></div>
        ) : (
          <ul className="divide-y divide-line">
            {docsRes.data.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded bg-brand-50 text-brand-700">
                    <FileText size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-bold">{d.title}</p>
                    <p className="text-xs text-muted">{d.className} · {d.term}, {d.session}{d.subject ? ` · ${d.subject}` : ''}</p>
                  </div>
                </div>
                <a href={d.fileUrl} target="_blank" rel="noreferrer" download className="inline-flex items-center rounded bg-brand-500 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700">
                  <Download aria-hidden="true" size={14} className="mr-1" /> Download PDF
                </a>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
};
