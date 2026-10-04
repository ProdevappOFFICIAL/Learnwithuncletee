import { useState } from 'react';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pill, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';
import { useAuth, useResource } from '@/context/AuthContext';
import { apiGet, apiPatch, apiPost } from '@/lib/api';
import { UploadButton } from '@/lib/uploadthing';

interface AssignmentRow {
  id: string;
  title: string;
  subject: string;
  className: string;
  dueAt: string;
  maxScore: number;
  _count: { submissions: number };
}

interface SubmissionRow {
  id: string;
  status: string;
  score?: number | null;
  fileUrl?: string | null;
  note?: string | null;
  student: { user_name: string; user_email: string };
}

interface ApiClass {
  id: string;
  name: string;
}

interface ApiSubject {
  id: string;
  name: string;
}

interface CourseAssignment {
  id: string;
  subjectId?: string | null;
  classId?: string | null;
  subject?: { name: string } | null;
  class?: { name: string } | null;
}

export const TeacherAssignmentsPage = () => {
  const { user } = useAuth();
  const list = useResource<AssignmentRow[]>('/school-assignments', { mine: '1' });
  const classesRes = useResource<ApiClass[]>('/classes');
  const subjectsRes = useResource<ApiSubject[]>('/subjects', { limit: 200 });
  const coursesRes = useResource<CourseAssignment[]>(
    user ? '/course-assignments' : null,
    { teacherId: user?.id, limit: 100 },
  );
  const [form, setForm] = useState({ title: '', subject: '', className: '', dueAt: '', instructions: '', maxScore: '20' });
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [subs, setSubs] = useState<SubmissionRow[] | null>(null);
  const [grading, setGrading] = useState<Record<string, string>>({});

  // Dropdowns come from the API, scoped to this teacher's assigned courses.
  const courses = coursesRes.data ?? [];
  const assignedClassNames = Array.from(
    new Set(courses.map((c) => c.class?.name).filter((n): n is string => Boolean(n))),
  );
  const assignedSubjectNames = Array.from(
    new Set(courses.map((c) => c.subject?.name).filter((n): n is string => Boolean(n))),
  );
  const classOptions = (classesRes.data ?? [])
    .map((c) => c.name)
    .filter((n) => assignedClassNames.length === 0 || assignedClassNames.includes(n));
  const subjectOptions = (subjectsRes.data ?? [])
    .map((s) => s.name)
    .filter((n) => assignedSubjectNames.length === 0 || assignedSubjectNames.includes(n));
  const className = classOptions.includes(form.className) ? form.className : (classOptions[0] ?? '');
  const subject = subjectOptions.includes(form.subject) ? form.subject : (subjectOptions[0] ?? '');

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setNotice(null);
    try {
      await apiPost('/school-assignments', {
        ...form,
        subject,
        className,
        maxScore: Math.max(1, Number(form.maxScore) || 20),
        attachmentUrl: attachmentUrl || undefined,
      });
      setNotice('Assignment published to class.');
      setForm({ title: '', subject: '', className: '', dueAt: '', instructions: '', maxScore: '20' });
      setAttachmentUrl('');
      list.reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Failed to publish');
    } finally {
      setBusy(false);
    }
  };

  const openSubmissions = async (id: string) => {
    setOpenId(id);
    setSubs(null);
    try {
      const res = await apiGet<SubmissionRow[]>(`/school-assignments/${id}/submissions`);
      setSubs(res.data);
    } catch (err: any) {
      setNotice(err?.message ?? 'Failed to load submissions');
    }
  };

  const grade = async (submissionId: string) => {
    const score = grading[submissionId];
    if (score === undefined || score === '') {
      setNotice('Enter a score first.');
      return;
    }
    try {
      await apiPatch(`/school-assignments/submissions/${submissionId}/grade`, { score: Number(score) });
      setNotice('Grade saved.');
      if (openId) openSubmissions(openId);
    } catch (err: any) {
      setNotice(err?.message ?? 'Grading failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Assignments"
        title="Assignments"
        text="Create classwork, track submissions and publish grades. Pupils see feedback instantly."
      />

      {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

      <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Create assignment</p>
          <h3 className="mt-2 font-display text-lg font-extrabold">New classwork</h3>
          <form className="mt-5 space-y-4" onSubmit={create}>
            <label className="block text-sm font-semibold">Title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Quadratic equations — exercise 5b" className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500" /></label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">Class
                <select value={className} onChange={(e) => setForm({ ...form, className: e.target.value })} className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm">
                  {classOptions.length === 0 ? <option value="">No assigned classes</option> : classOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </label>
              <label className="block text-sm font-semibold">Due date<input type="datetime-local" required value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm" /></label>
            </div>
            <label className="block text-sm font-semibold">Subject
              <select value={subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm">
                {subjectOptions.length === 0 ? <option value="">No assigned subjects</option> : subjectOptions.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-semibold">Max score
                <input value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: e.target.value })} type="number" min={1} required placeholder="e.g. 20" className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm" />
              </label>
              <p className="self-end pb-1 text-xs text-muted">Pupils are graded out of this score.</p>
            </div>
            <label className="block text-sm font-semibold">Instructions<textarea rows={3} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="What should pupils do and submit?" className="mt-2 w-full rounded border border-line bg-white px-3 py-3 text-sm outline-none focus:border-brand-500" /></label>
            <div>
              <p className="text-sm font-semibold">Attachment {attachmentUrl && <span className="text-emerald-700">✓ uploaded</span>}</p>
              <div className="mt-2">
                <UploadButton endpoint="assignmentUploader" onClientUploadComplete={(res) => setAttachmentUrl(res?.[0]?.ufsUrl ?? '')} onUploadError={(err) => setNotice(err.message)} />
              </div>
            </div>
            <button type="submit" disabled={busy} className="min-h-11 w-full rounded bg-brand-900 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
              {busy ? 'Publishing…' : 'Publish to class'}
            </button>
          </form>
        </Card>

        <Card>
          <CardHead title="My assignments" sub="Your classwork" />
          {list.loading ? (
            <div className="px-5 py-5"><LoadingSkeleton rows={3} /></div>
          ) : list.error || !list.data ? (
            <div className="px-5 py-5"><ErrorState message={list.error ?? 'No data'} onRetry={list.reload} /></div>
          ) : list.data.length === 0 ? (
            <div className="px-5 py-5"><EmptyState message="No assignments yet — publish your first one." /></div>
          ) : (
            <TableWrap>
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead><tr><Th>Title</Th><Th>Due</Th><Th>Submitted</Th><Th><span className="sr-only">Actions</span></Th></tr></thead>
                <tbody>
                  {list.data.map((a) => (
                    <tr key={a.id}>
                      <Td><span className="font-bold">{a.title}</span><span className="block text-xs text-muted">{a.className} · {a.subject} · /{a.maxScore}</span></Td>
                      <Td>{new Date(a.dueAt).toLocaleDateString()}</Td>
                      <Td className="font-semibold">{a._count.submissions}</Td>
                      <Td><button type="button" onClick={() => openSubmissions(a.id)} className="rounded border border-line px-3 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700">Submissions</button></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Card>
      </div>

      {openId && (
        <Card>
          <CardHead title="Submissions" sub="Grade pupil work" />
          {!subs ? (
            <div className="px-5 py-5"><LoadingSkeleton rows={3} /></div>
          ) : subs.length === 0 ? (
            <div className="px-5 py-5"><EmptyState message="No submissions yet." /></div>
          ) : (
            <TableWrap>
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead><tr><Th>Pupil</Th><Th>File</Th><Th>Status</Th><Th>Score</Th><Th><span className="sr-only">Actions</span></Th></tr></thead>
                <tbody>
                  {subs.map((s) => (
                    <tr key={s.id}>
                      <Td className="font-bold">{s.student.user_name}</Td>
                      <Td>{s.fileUrl ? <a href={s.fileUrl} target="_blank" rel="noreferrer" className="font-bold text-brand-700 underline">Open file</a> : <span className="text-muted">{s.note ?? '—'}</span>}</Td>
                      <Td><Pill tone={s.status === 'GRADED' ? 'emerald' : 'amber'}>{s.status}</Pill></Td>
                      <Td>
                        <input value={grading[s.id] ?? s.score ?? ''} onChange={(e) => setGrading({ ...grading, [s.id]: e.target.value })} type="number" min={0} max={list.data?.find((a) => a.id === openId)?.maxScore ?? undefined} title={`Score out of ${list.data?.find((a) => a.id === openId)?.maxScore ?? '—'}`} className="w-20 rounded border border-line px-2 py-1.5 text-sm" />
                      </Td>
                      <Td><button type="button" onClick={() => grade(s.id)} className="rounded bg-brand-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700">Save</button></Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          )}
        </Card>
      )}
    </div>
  );
};
