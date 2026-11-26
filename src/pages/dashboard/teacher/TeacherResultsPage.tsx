import { useState } from 'react';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pill, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';
import { useAuth, useResource } from '@/context/AuthContext';
import { TERM_OPTIONS, sessionOptions, type GradeData, type ResultDocData } from '@/data/dashboard';
import type { StudentRow } from '@/data/dashboard';
import { Download, FileText } from 'lucide-react';

interface ClassRow extends GradeData {
  studentId: string;
  studentName: string;
  studentCode: string;
}

interface CourseAssignment {
  id: string;
  subjectId?: string | null;
  classId?: string | null;
  subject?: { name: string } | null;
  class?: { name: string } | null;
}

export const TeacherResultsPage = () => {
  const { user } = useAuth();
  const sessions = sessionOptions();
  const courses = useResource<CourseAssignment[]>(
    user ? '/course-assignments' : null,
    { teacherId: user?.id, limit: 100 },
  );

  const assignedSubjects = Array.from(
    new Set((courses.data ?? []).map((c) => c.subject?.name).filter((n): n is string => Boolean(n))),
  );
  const assignedClasses = Array.from(
    new Set((courses.data ?? []).map((c) => c.class?.name).filter((n): n is string => Boolean(n))),
  );

  const [subject, setSubject] = useState('');
  const [className, setClassName] = useState('');
  const [session, setSession] = useState(sessions[0] ?? '2025/2026');
  const [term, setTerm] = useState(TERM_OPTIONS[0]);
  const [studentId, setStudentId] = useState('');
  const [fetched, setFetched] = useState(false);

  const pupils = useResource<StudentRow[]>('/students', { className: className || undefined, limit: 100 });
  const results = useResource<ClassRow[]>(
    fetched ? '/school-results/class' : null,
    { subject, className, session, term },
  );
  const docs = useResource<ResultDocData[]>(
    fetched ? '/result-documents' : null,
    { className, session, term, studentId: studentId || undefined },
  );

  const selectClass = 'mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm font-bold';
  const canFetch = subject !== '' && className !== '' && studentId !== '';

  const fetchResults = (e: React.FormEvent) => {
    e.preventDefault();
    if (canFetch) setFetched(true);
  };

  const pupil = (pupils.data ?? []).find((p) => p.id === studentId);
  const rows = (results.data ?? []).filter((r) => r.studentId === studentId);
  const sheet = (docs.data ?? []).find((d) => d.studentId === studentId) ?? docs.data?.[0];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Results"
        title="Results"
        text="Check your pupils' results. Pick a subject, class and pupil from your assigned courses, then fetch."
      />

      <Card className="p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Find a pupil's result</p>
        <form onSubmit={fetchResults} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block text-sm font-semibold">Subject
            <select value={subject} onChange={(e) => { setSubject(e.target.value); setFetched(false); }} className={`${selectClass} mt-2 w-full`}>
              <option value="">— Select —</option>
              {assignedSubjects.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">Grade (class)
            <select value={className} onChange={(e) => { setClassName(e.target.value); setStudentId(''); setFetched(false); }} className={`${selectClass} mt-2 w-full`}>
              <option value="">— Select —</option>
              {assignedClasses.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">Session
            <select value={session} onChange={(e) => { setSession(e.target.value); setFetched(false); }} className={`${selectClass} mt-2 w-full`}>
              {sessions.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">Term
            <select value={term} onChange={(e) => { setTerm(e.target.value); setFetched(false); }} className={`${selectClass} mt-2 w-full`}>
              {TERM_OPTIONS.map((t) => <option key={t}>{t}</option>)}
            </select>
          </label>
          <label className="block text-sm font-semibold">Pupil
            <select value={studentId} onChange={(e) => { setStudentId(e.target.value); setFetched(false); }} className={`${selectClass} mt-2 w-full`}>
              <option value="">— Select —</option>
              {(pupils.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.user_name}{p.student?.studentCode ? ` · ${p.student.studentCode}` : ''}</option>)}
            </select>
          </label>
        </form>
        <button
          type="button"
          onClick={fetchResults}
          disabled={!canFetch}
          className="mt-4 inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          Fetch results
        </button>
        {(assignedSubjects.length === 0 || assignedClasses.length === 0) && !courses.loading && (
          <p className="mt-3 text-xs text-muted">No courses assigned to you yet — ask an administrator to assign you a subject and class.</p>
        )}
      </Card>

      {fetched && (
        <Card>
          <CardHead
            title={pupil ? `${pupil.user_name}${pupil.student?.studentCode ? ` · ${pupil.student.studentCode}` : ''}` : 'Result'}
            sub={`${subject} · ${className} · ${term}, ${session}`}
          />
          {results.loading ? (
            <div className="px-5 py-5"><LoadingSkeleton rows={4} /></div>
          ) : results.error || !results.data ? (
            <div className="px-5 py-5"><ErrorState message={results.error ?? 'No data'} onRetry={results.reload} /></div>
          ) : rows.length === 0 ? (
            <div className="px-5 py-5"><EmptyState message="No published result found for this pupil and selection." /></div>
          ) : (
            <TableWrap>
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead><tr><Th>Subject</Th><Th>CA / 30</Th><Th>Exam / 70</Th><Th>Total / 100</Th><Th>Grade</Th></tr></thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <Td className="font-bold">{r.subject}</Td>
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
          <div className="border-t border-line px-5 py-4">
            {docs.loading ? (
              <LoadingSkeleton rows={1} />
            ) : sheet ? (
              <a
                href={sheet.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded bg-brand-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
              >
                <FileText size={16} aria-hidden="true" /> Open report sheet
                <Download size={14} aria-hidden="true" className="text-white/70" />
              </a>
            ) : (
              <p className="text-xs text-muted">No report sheet uploaded for this pupil and term yet.</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};
