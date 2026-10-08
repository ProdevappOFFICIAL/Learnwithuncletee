import { useState } from 'react';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, StatTile } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { apiDelete, apiPost } from '@/lib/api';
import { UploadButton } from '@/lib/uploadthing';
import { TERM_OPTIONS, sessionOptions, type GradeData, type ResultDocData, type StudentRow } from '@/data/dashboard';
import type { ClassItem } from '@/data/dashboard';
import { Download, FileText, Trash2 } from 'lucide-react';

interface ClassRow extends GradeData {
  studentName: string;
  studentCode: string;
}

//const SUBJECTS = ['Mathematics', 'English Language', 'Basic Science', 'Social Studies', 'ICT', 'Civic Education'];

export const AdminResultsPage = () => {
  const sessions = sessionOptions();
  const [subject, _setSubject] = useState('Mathematics');
  const [className, setClassName] = useState('');
  const [session, setSession] = useState('2025/2026');
  const [term, setTerm] = useState('First Term');
  const [docStudentId, setDocStudentId] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const selectClass = 'min-h-11 rounded border border-line bg-white px-3 text-sm font-bold';

  const classesRes = useResource<ClassItem[]>('/classes');
  const classOptions = Array.from(
    new Set([...(classesRes.data ?? []).map((c) => c.name)]),
  );
  const effectiveClass = classOptions.includes(className) ? className : (classOptions[0] ?? className);
  const results = useResource<ClassRow[]>('/school-results/class', { subject, className: effectiveClass, session, term });
  const pupils = useResource<StudentRow[]>('/students', { className: effectiveClass, limit: 100 });
  const docs = useResource<ResultDocData[]>('/result-documents', { className: effectiveClass, session, term });
  const [docTitle, setDocTitle] = useState('');
  const [docUrl, setDocUrl] = useState('');

  const data = results.data ?? [];
  const avg = data.length ? data.reduce((s, r) => s + r.total, 0) / data.length : 0;

  const uploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docUrl) {
      setNotice('Upload the exam result PDF first.');
      return;
    }
    if (!docStudentId) {
      setNotice('Select the pupil this report sheet belongs to.');
      return;
    }
    const pupil = (pupils.data ?? []).find((p) => p.id === docStudentId);
    setBusy(true);
    setNotice(null);
    try {
      await apiPost('/result-documents', {
        title: docTitle.trim() || `${pupil?.user_name ?? 'Pupil'} — ${term} report sheet`,
        className: effectiveClass,
        session,
        term,
        studentId: docStudentId,
        fileUrl: docUrl,
      });
      setNotice(`Report sheet published for ${pupil?.user_name ?? 'the pupil'} (${effectiveClass} · ${term}, ${session}).`);
      setDocTitle('');
      setDocUrl('');
      setDocStudentId('');
      docs.reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Upload failed');
    } finally {
      setBusy(false);
    }
  };

  const deleteDoc = async (docId: string) => {
    if (!confirm('Delete this result PDF? Pupils will lose access.')) return;
    try {
      await apiDelete(`/result-documents/${docId}`);
      docs.reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Delete failed');
    }
  };

  const publish = async (published: boolean) => {
    setNotice(null);
    try {
      await apiPost('/school-results/publish', { className: effectiveClass, session, term, published });
      setNotice(published ? `Published ${effectiveClass} · ${term}, ${session}. Pupils can now see it.` : `Hidden ${effectiveClass} · ${term}, ${session}.`);
      results.reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Failed');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academics"
        title="Results oversight"
        text="Upload each pupil's full exam report sheet — pick the class, session, term and pupil, then publish the PDF. Teacher-entered subject scores appear in the broadsheet below."
        actions={
          <>
            <button type="button" onClick={() => publish(true)} className="inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">Publish selection</button>
            <button type="button" onClick={() => publish(false)} className="inline-flex min-h-11 items-center rounded border border-line bg-white px-5 py-2.5 text-sm font-bold hover:border-brand-500 hover:text-brand-700">Hide selection</button>
          </>
        }
      />
      {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

      <Card className="p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Add result · exam report sheet</p>
        <p className="mt-1 text-sm text-muted">Pick the exact pupil — the uploaded PDF is that pupil's full report sheet for this class, session and term. No subject needed.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm font-semibold">Grade (class)
            <select value={effectiveClass} onChange={(e) => setClassName(e.target.value)} className={`${selectClass} mt-2 w-full`}>
              {classesRes.loading ? (
                <option>Loading classes…</option>
              ) : classOptions.length === 0 ? (
                <option value="">No classes found</option>
              ) : (
                classOptions.map((c) => <option key={c} value={c}>{c}</option>)
              )}
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
          <label className="block text-sm font-semibold">Pupil
            <select value={docStudentId} onChange={(e) => setDocStudentId(e.target.value)} className={`${selectClass} mt-2 w-full`}>
              <option value="">— Select pupil —</option>
              {(pupils.data ?? []).map((p) => <option key={p.id} value={p.id}>{p.user_name}</option>)}
            </select>
          </label>
        </div>
        <form onSubmit={uploadDoc} className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-[1.4fr_auto_auto]">
          <label className="block text-sm font-semibold">Document title (optional)
            <input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="Defaults to “Name — Term report sheet”" className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm" />
          </label>
          <div>
            <p className="text-sm font-semibold">Report PDF {docUrl && <span className="text-emerald-700">✓ uploaded</span>}</p>
            <div className="mt-2">
              <UploadButton endpoint="assignmentUploader" label="Upload PDF" onClientUploadComplete={(res) => setDocUrl(res?.[0]?.ufsUrl ?? '')} onUploadError={(err) => setNotice(err.message)} />
            </div>
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={busy} className="min-h-11 rounded bg-brand-900 px-5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
              {busy ? '…' : 'Upload exam results'}
            </button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHead title="Result documents" sub={`${effectiveClass} · ${term}, ${session}`} />
        {docs.loading ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={3} /></div>
        ) : docs.error || !docs.data ? (
          <div className="px-5 py-5"><ErrorState message={docs.error ?? 'No data'} onRetry={docs.reload} /></div>
        ) : docs.data.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message="No result PDFs published for this selection yet." /></div>
        ) : (
          <ul className="divide-y divide-line">
            {docs.data.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded bg-brand-50 text-brand-700">
                    <FileText size={18} aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-bold">{d.title}</p>
                    <p className="text-xs text-muted">{d.student?.user_name ? `${d.student.user_name} · ` : ''}{d.subject ?? 'Full report sheet'} · by {d.uploader?.user_name ?? 'admin'} · {new Date(d.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <a href={d.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center rounded border border-line px-3 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700">
                    <Download aria-hidden="true" size={14} className="mr-1" /> Open
                  </a>
                  <button type="button" onClick={() => deleteDoc(d.id)} className="inline-flex items-center rounded border border-line px-3 py-1.5 text-xs font-bold text-rose-700 hover:border-rose-300">
                    <Trash2 aria-hidden="true" size={14} className="mr-1" /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {results.loading ? (
        <LoadingSkeleton rows={5} />
      ) : results.error || !results.data ? (
        <ErrorState message={results.error ?? 'No data'} onRetry={results.reload} />
      ) : (
        <>
          <div className="hidden grid gap-4 sm:grid-cols-3">
            <StatTile label="Average" value={`${avg.toFixed(1)}%`} hint={`${effectiveClass} · ${term}`} />
            <StatTile label="Entries" value={String(data.length)} hint={session} />
            <StatTile label="Subjects" value={String(new Set(data.map((r) => r.subject)).size)} hint="In this selection" />
          </div>
    
        </>
      )}
    </div>
  );
};
