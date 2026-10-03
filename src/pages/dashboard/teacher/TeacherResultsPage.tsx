import { useState } from 'react';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pill, StatTile, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { apiPost } from '@/lib/api';
import { CLASS_OPTIONS, TERM_OPTIONS, sessionOptions, type GradeData } from '@/data/dashboard';
import type { StudentRow } from '@/data/dashboard';

interface ClassRow extends GradeData {
  studentName: string;
  studentCode: string;
}

const SUBJECTS = ['Mathematics', 'English Language', 'Basic Science', 'Social Studies', 'ICT', 'Civic Education'];

export const TeacherResultsPage = () => {
  const sessions = sessionOptions();
  const [subject, setSubject] = useState('Mathematics');
  const [className, setClassName] = useState('JSS 2 Diamond');
  const [session, setSession] = useState('2025/2026');
  const [term, setTerm] = useState('First Term');
  const results = useResource<ClassRow[]>('/school-results/class', { subject, className, session, term });
  const pupils = useResource<StudentRow[]>('/students', { className, limit: 100 });
  const [entry, setEntry] = useState({ studentId: '', ca: '', exam: '' });
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const data = results.data ?? [];
  const avg = data.length ? data.reduce((s, r) => s + r.total, 0) / data.length : 0;
  const selectClass = 'min-h-11 rounded border border-line bg-white px-3 text-sm font-bold';

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entry.studentId) {
      setNotice('Choose a pupil first.');
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      await apiPost('/school-results/enter', {
        entries: [{ studentId: entry.studentId, subject, className, session, term, ca: Number(entry.ca) || 0, exam: Number(entry.exam) || 0 }],
      });
      setNotice(`Saved for ${className} · ${term}, ${session}. Total and grade computed server-side.`);
      setEntry({ studentId: '', ca: '', exam: '' });
      results.reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Results"
        title="Results & grading"
        text="Pick the grade, session and term, then enter CA and exam scores. Totals and grades are computed automatically."
      />

      {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

      <Card className="p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Filter & enter</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm font-semibold">Subject
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className={`${selectClass} mt-2 w-full`}>
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">Grade (class)
            <select value={className} onChange={(e) => setClassName(e.target.value)} className={`${selectClass} mt-2 w-full`}>
              {CLASS_OPTIONS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">Session
            <select value={session} onChange={(e) => setSession(e.target.value)} className={`${selectClass} mt-2 w-full`}>
              {sessions.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">Term
            <select value={term} onChange={(e) => setTerm(e.target.value)} className={`${selectClass} mt-2 w-full`}>
              {TERM_OPTIONS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
        </div>

        <form onSubmit={save} className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-[1.4fr_.6fr_.6fr_auto]">
          <select required value={entry.studentId} onChange={(e) => setEntry({ ...entry, studentId: e.target.value })} className="min-h-11 rounded border border-line bg-white px-3 text-sm">
            <option value="">— Pupil —</option>
            {(pupils.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.user_name}{p.studentProfile?.studentCode ? ` · ${p.studentProfile.studentCode}` : ''}</option>)}
          </select>
          <input required type="number" min={0} max={30} placeholder="CA / 30" value={entry.ca} onChange={(e) => setEntry({ ...entry, ca: e.target.value })} className="min-h-11 rounded border border-line px-3 text-sm" />
          <input required type="number" min={0} max={70} placeholder="Exam / 70" value={entry.exam} onChange={(e) => setEntry({ ...entry, exam: e.target.value })} className="min-h-11 rounded border border-line px-3 text-sm" />
          <button type="submit" disabled={busy} className="min-h-11 rounded bg-brand-500 px-5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
            {busy ? '…' : 'Save'}
          </button>
        </form>
      </Card>

      {results.loading ? (
        <LoadingSkeleton rows={5} />
      ) : results.error || !results.data ? (
        <ErrorState message={results.error ?? 'No data'} onRetry={results.reload} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile label="Class average" value={`${avg.toFixed(1)}%`} hint={`${className} · ${term}`} />
            <StatTile label="Entries" value={String(data.length)} hint={session} />
            <StatTile label="Pass rate" value={data.length ? `${Math.round((data.filter((r) => r.grade !== 'F').length / data.length) * 100)}%` : '—'} hint="Grade F excluded" />
          </div>

          <Card>
            <CardHead title={`${subject} — ${className}`} sub={`${term}, ${session}`} />
            {data.length === 0 ? (
              <div className="px-5 py-5"><EmptyState message="No entries yet for this selection. Enter scores above." /></div>
            ) : (
              <TableWrap>
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead><tr><Th>Pupil</Th><Th>CA / 30</Th><Th>Exam / 70</Th><Th>Total / 100</Th><Th>Grade</Th></tr></thead>
                  <tbody>
                    {data.map((r) => (
                      <tr key={r.id}>
                        <Td className="font-bold">{r.studentName}<span className="block text-xs font-medium text-muted">{r.studentCode}</span></Td>
                        <Td>{r.ca}</Td>
                        <Td>{r.exam}</Td>
                        <Td className="font-extrabold text-brand-700">{r.total}</Td>
                        <Td><Pill tone={r.grade === 'A' ? 'emerald' : r.grade === 'F' ? 'rose' : 'sky'}>{r.grade}</Pill></Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            )}
            <p className="border-t border-line bg-brand-50/60 px-5 py-3 text-xs text-muted">Scores are draft until published by the academic office.</p>
          </Card>
        </>
      )}
    </div>
  );
};
