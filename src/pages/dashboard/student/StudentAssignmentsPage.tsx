import { useState } from 'react';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pill } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { apiPost } from '@/lib/api';
import { UploadButton } from '@/lib/uploadthing';
import type { HomeworkData } from '@/data/dashboard';

const toneFor = (hasSubmission: boolean, score?: number | null) =>
  score !== null && score !== undefined ? 'emerald' : hasSubmission ? 'sky' : 'amber';

export const StudentAssignmentsPage = () => {
  const { data, loading, error, reload } = useResource<HomeworkData[]>('/school-assignments/mine');
  const [selected, setSelected] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const pending = (data ?? []).filter((a) => !a.submission);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = selected || pending[0]?.id;
    if (!id) {
      setNotice('No pending assignment to submit.');
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      await apiPost(`/school-assignments/${id}/submit`, { fileUrl: fileUrl || undefined, note: note || undefined });
      setNotice('Submitted successfully.');
      setFileUrl('');
      setNote('');
      reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Submission failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Assignments"
        title="Assignments"
        text="Submit classwork before the due date. Graded work shows your score and teacher feedback."
      />

      {loading ? (
        <LoadingSkeleton rows={5} />
      ) : error || !data ? (
        <ErrorState message={error ?? 'No data'} onRetry={reload} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
          <Card className="p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Submit assignment</p>
            <h3 className="mt-2 font-display text-lg font-extrabold">Upload your work</h3>
            <p className="mt-1 text-sm text-muted">Upload via the button, then submit. Late work is flagged automatically.</p>
            <form className="mt-5 space-y-4" onSubmit={submit}>
              <label className="block text-sm font-semibold">Assignment
                <select value={selected} onChange={(e) => setSelected(e.target.value)} className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500">
                  <option value="">— Choose —</option>
                  {pending.map((a) => <option key={a.id} value={a.id}>{a.subject} — {a.title}</option>)}
                </select>
              </label>
              <div>
                <p className="text-sm font-semibold">Attachment {fileUrl && <span className="text-emerald-700">✓ uploaded</span>}</p>
                <div className="mt-2">
                  <UploadButton
                    endpoint="assignmentUploader"
                    onClientUploadComplete={(res) => setFileUrl(res?.[0]?.ufsUrl ?? '')}
                    onUploadError={(err) => setNotice(err.message)}
                  />
                </div>
              </div>
              <label className="block text-sm font-semibold">Note for teacher (optional)
                <textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Anything your teacher should know…" className="mt-2 w-full rounded border border-line bg-white px-3 py-3 text-sm outline-none focus:border-brand-500" />
              </label>
              <button type="submit" disabled={busy} className="min-h-11 w-full rounded bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
                {busy ? 'Submitting…' : 'Submit assignment'}
              </button>
            </form>
            {notice && <p role="status" className="mt-4 border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}
          </Card>

          <Card>
            <CardHead title="All assignments" sub={`${data.length} assigned`} />
            {data.length === 0 ? (
              <div className="px-5 py-5"><EmptyState message="No assignments yet." /></div>
            ) : (
              <ul className="divide-y divide-line">
                {data.map((a) => {
                  const s = a.submission;
                  const label = s?.score !== null && s?.score !== undefined ? `Graded · ${s.score}/${a.maxScore}` : s ? s.status : 'Pending';
                  return (
                    <li key={a.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-widest text-brand-700">{a.subject} · {a.teacher?.user_name ?? ''}</p>
                          <h4 className="mt-1 font-display text-sm font-extrabold">{a.title}</h4>
                          <p className="mt-1 text-xs text-muted">Due {new Date(a.dueAt).toLocaleString()} · {a.maxScore} marks</p>
                          {s?.feedback && <p className="mt-1 text-xs text-muted">Feedback: {s.feedback}</p>}
                        </div>
                        <Pill tone={toneFor(Boolean(s), s?.score) as 'amber'}>{label}</Pill>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};
