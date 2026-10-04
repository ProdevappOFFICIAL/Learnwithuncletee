import { useState } from 'react';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, PageHeader, Pill, StatTile, TableWrap, Td, Th } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { apiDelete, apiPost } from '@/lib/api';
import { UploadButton } from '@/lib/uploadthing';
import { CLASS_OPTIONS, TERM_OPTIONS, sessionOptions, type GradeData, type ResultDocData } from '@/data/dashboard';
import { Download, FileText, Trash2 } from 'lucide-react';

interface ClassRow extends GradeData {
  studentName: string;
  studentCode: string;
}

const SUBJECTS = ['Mathematics', 'English Language', 'Basic Science', 'Social Studies', 'ICT', 'Civic Education'];

export const AdminResultsPage = () => {
  const sessions = sessionOptions();
  const [subject, setSubject] = useState('Mathematics');
  const [className, setClassName] = useState('JSS 2 Diamond');
  const [session, setSession] = useState('2025/2026');
  const [term, setTerm] = useState('First Term');
  const results = useResource<ClassRow[]>('/school-results/class', { subject, className, session, term });
  const docs = useResource<ResultDocData[]>('/result-documents', { className, session, term });
  const [docTitle, setDocTitle] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const selectClass = 'min-h-11 rounded border border-line bg-white px-3 text-sm font-bold';

  const data = results.data ?? [];
  const avg = data.length ? data.reduce((s, r) => s + r.total, 0) / data.length : 0;

  const uploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docUrl) {
      setNotice('Upload the result PDF first.');
      return;
    }
    if (!docTitle.trim()) {
      setNotice('Give the document a title (e.g. JSS 2 Broadsheet).');
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      await apiPost('/result-documents', {
        title: docTitle.trim(),
        className,
        session,
        term,
        subject,
        fileUrl: docUrl,
      });
      setNotice(`Result PDF published for ${className} · ${term}, ${session}. Pupils can download it now.`);
      setDocTitle('');
      setDocUrl('');
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
      await apiPost('/school-results/publish', { className, session, term, published });
      setNotice(published ? `Published ${className} · ${term}, ${session}. Pupils can now see it.` : `Hidden ${className} · ${term}, ${session}.`);
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
        text="Publish result PDFs per grade, session and term — pupils in that class can download them. Teacher-entered scores appear in the broadsheet below."
        actions={
          <>
            <button type="button" onClick={() => publish(true)} className="inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">Publish selection</button>
            <button type="button" onClick={() => publish(false)} className="inline-flex min-h-11 items-center rounded border border-line bg-white px-5 py-2.5 text-sm font-bold hover:border-brand-500 hover:text-brand-700">Hide selection</button>
          </>
        }
      />
      {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

      <Card className="p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Add result · PDF upload</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          <label className="block text-sm font-semibold">Subject
            <select value={subject} onChange={(e) => setSubject(e.target.value)} className={`${selectClass} mt-2 w-full`}>
              {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
        </div>
        <form onSubmit={uploadDoc} className="mt-4 grid gap-3 border-t border-line pt-4 sm:grid-cols-[1.4fr_auto_auto]">
          <label className="block text-sm font-semibold">Document title
            <input value={docTitle} onChange={(e) => setDocTitle(e.target.value)} placeholder="e.g. JSS 2 Diamond broadsheet" className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm" />
          </label>
          <div>
            <p className="text-sm font-semibold">Result PDF {docUrl && <span className="text-emerald-700">✓ uploaded</span>}</p>
            <div className="mt-2">
              <UploadButton endpoint="assignmentUploader" label="Upload PDF" onClientUploadComplete={(res) => setDocUrl(res?.[0]?.ufsUrl ?? '')} onUploadError={(err) => setNotice(err.message)} />
            </div>
          </div>
          <div className="flex items-end">
            <button type="submit" disabled={busy} className="min-h-11 rounded bg-brand-900 px-5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
              {busy ? '…' : 'Publish PDF'}
            </button>
          </div>
        </form>
      </Card>

      <Card>
        <CardHead title="Result documents" sub={`${className} · ${term}, ${session}`} />
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
                    <p className="text-xs text-muted">{d.subject ?? 'All subjects'} · by {d.uploader?.user_name ?? 'admin'} · {new Date(d.createdAt).toLocaleDateString()}</p>
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
          <div className="grid gap-4 sm:grid-cols-3">
            <StatTile label="Average" value={`${avg.toFixed(1)}%`} hint={`${className} · ${term}`} />
            <StatTile label="Entries" value={String(data.length)} hint={session} />
            <StatTile label="Subjects" value={String(new Set(data.map((r) => r.subject)).size)} hint="In this selection" />
          </div>
          <Card>
            <CardHead title={`${className} broadsheet`} sub={`${term}, ${session} · ${subject}`} />
            {data.length === 0 ? (
              <div className="px-5 py-5"><EmptyState message="No entries for this selection yet. Add results above." /></div>
            ) : (
              <TableWrap>
                <table className="w-full min-w-[560px] text-left text-sm">
                  <thead><tr><Th>Pupil</Th><Th>CA</Th><Th>Exam</Th><Th>Total / 100</Th><Th>Grade</Th></tr></thead>
                  <tbody>
                    {data.map((r) => (
                      <tr key={r.id}>
                        <Td className="font-bold">{r.studentName}<span className="block text-xs font-medium text-muted">{r.studentCode}</span></Td>
                        <Td>{r.ca}</Td>
                        <Td>{r.exam}</Td>
                        <Td className="font-bold text-brand-700">{r.total}</Td>
                        <Td><Pill tone={r.grade === 'A' ? 'emerald' : r.grade === 'F' ? 'rose' : 'sky'}>{r.grade}</Pill></Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableWrap>
            )}
          </Card>
        </>
      )}
    </div>
  );
};
