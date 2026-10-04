import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, Modal, PageHeader, Pill } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { apiDelete, apiPost } from '@/lib/api';
import type { ExamDeploymentItem, ExamItem } from '@/data/dashboard';
import { Cloud, CloudOff, Copy, Play, Plus, Square, Trash2 } from 'lucide-react';

type ModeFilter = '' | 'ONLINE' | 'OFFLINE';

export const DeploymentsPage = () => {
  const [modeFilter, setModeFilter] = useState<ModeFilter>('');
  const { data, loading, error, reload } = useResource<ExamDeploymentItem[]>('/exam-deployments', { mode: modeFilter || undefined, limit: 100 });
  const exams = useResource<ExamItem[]>('/exams', { limit: 200 });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [examId, setExamId] = useState('');
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [liveCode, setLiveCode] = useState<{ code: string; id: string } | null>(null);

  const openDialog = () => {
    setExamId('');
    setLiveCode(null);
    setNotice(null);
    setDialogOpen(true);
  };

  const deploy = async (startNow: boolean) => {
    if (!examId) {
      setNotice('Select an exam first.');
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const res = await apiPost<ExamDeploymentItem>('/exam-deployments', { examId, mode: 'ONLINE' });
      if (startNow) {
        const started = await apiPost<ExamDeploymentItem>(`/exam-deployments/${res.data.id}/start`, {});
        setLiveCode({ code: started.data.code, id: started.data.id });
        setNotice(`Deployment is LIVE — share code ${started.data.code} with pupils.`);
      } else {
        setNotice(`Draft deployment created (${res.data.code}). Start it when ready.`);
      }
      setExamId('');
      reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Deploy failed');
    } finally {
      setBusy(false);
    }
  };

  const end = async (id: string) => {
    if (!confirm('End this deployment? Pupils will no longer be able to join.')) return;
    setRowBusy(id);
    try {
      await apiPost(`/exam-deployments/${id}/end`, {});
      reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Could not end deployment');
    } finally {
      setRowBusy(null);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this deployment? This cannot be undone.')) return;
    setRowBusy(id);
    try {
      await apiDelete(`/exam-deployments/${id}`);
      reload();
    } catch (err: any) {
      setNotice(err?.message ?? 'Delete failed');
    } finally {
      setRowBusy(null);
    }
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setNotice(`Code ${code} copied.`);
    } catch {
      setNotice(`Code: ${code}`);
    }
  };

  const statusTone = (s: string) => (s === 'LIVE' ? 'emerald' : s === 'ENDED' ? 'rose' : 'amber') as 'emerald' | 'rose' | 'amber';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Exam & Test"
        title="Deployments"
        text="Put an exam live so pupils can sit it at /examination/:code, or wind it down afterwards."
      />
      {notice && !dialogOpen && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={openDialog}
          className="border border-line bg-white p-6 text-left hover:border-brand-500"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-500 text-white">
            <Cloud size={22} aria-hidden="true" />
          </span>
          <span className="mt-4 block font-display text-xl font-extrabold">Online deployment</span>
          <span className="mt-1 block text-sm text-muted">Deploy an exam with a join code. Pupils log in at the examination page and submit — scores land in test Results.</span>
          <span className="mt-4 inline-block text-sm font-bold text-brand-700">Deploy this exam →</span>
        </button>
        <div className="relative border border-line bg-white p-6 opacity-70" aria-disabled="true">
          <span className="absolute right-4 top-4"><Pill tone="amber">Locked</Pill></span>
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-line text-muted">
            <CloudOff size={22} aria-hidden="true" />
          </span>
          <span className="mt-4 block font-display text-xl font-extrabold">Offline deployment</span>
          <span className="mt-1 block text-sm text-muted">Paper-based / offline-centre sittings. Coming soon — left in place for now.</span>
        </div>
      </div>

      <Card>
        <CardHead title="Deployments" sub="All modes and states" />
        <div className="flex flex-wrap gap-2 border-b border-line px-5 py-4" role="group" aria-label="Filter by mode">
          {(['', 'ONLINE', 'OFFLINE'] as ModeFilter[]).map((m) => (
            <button
              key={m || 'all'}
              type="button"
              onClick={() => setModeFilter(m)}
              aria-pressed={modeFilter === m}
              className={`min-h-10 rounded px-4 py-2 text-sm font-semibold ${modeFilter === m ? 'bg-brand-700 text-white' : 'border border-line text-muted hover:border-brand-500 hover:text-brand-700'}`}
            >
              {m === '' ? 'All' : m === 'ONLINE' ? 'Online' : 'Offline'}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={4} /></div>
        ) : error || !data ? (
          <div className="px-5 py-5"><ErrorState message={error ?? 'No data'} onRetry={reload} /></div>
        ) : data.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message="No deployments yet. Deploy an exam to get a join code." /></div>
        ) : (
          <ul className="divide-y divide-line">
            {data.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
                    {d.exam?.exam_name ?? 'Exam'}
                    <Pill tone={d.mode === 'ONLINE' ? 'sky' : 'amber'}>{d.mode}</Pill>
                    <Pill tone={statusTone(d.status)}>{d.status}</Pill>
                  </p>
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <span className="font-mono font-bold text-ink">{d.code}</span>
                    <button type="button" onClick={() => copyCode(d.code)} aria-label={`Copy code ${d.code}`} title="Copy code" className="inline-flex items-center gap-1 font-bold text-brand-700 hover:underline">
                      <Copy size={12} aria-hidden="true" /> Copy
                    </button>
                    <span>·</span>
                    <Link to={`/examination/${d.code}`} className="font-bold text-brand-700 hover:underline">/examination/{d.code}</Link>
                  </p>
                </div>
                <span className="flex shrink-0 gap-2">
                  {d.status !== 'LIVE' && d.status !== 'ENDED' && (
                    <button
                      type="button"
                      disabled={rowBusy === d.id}
                      onClick={async () => {
                        setRowBusy(d.id);
                        try {
                          const res = await apiPost<ExamDeploymentItem>(`/exam-deployments/${d.id}/start`, {});
                          setNotice(`Deployment is LIVE — code ${res.data.code}.`);
                          reload();
                        } catch (err: any) {
                          setNotice(err?.message ?? 'Could not start');
                        } finally {
                          setRowBusy(null);
                        }
                      }}
                      className="inline-flex items-center rounded bg-brand-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-60"
                    >
                      <Play size={14} aria-hidden="true" className="mr-1" /> Start
                    </button>
                  )}
                  {d.status === 'LIVE' && (
                    <button
                      type="button"
                      disabled={rowBusy === d.id}
                      onClick={() => end(d.id)}
                      className="inline-flex items-center rounded border border-line px-3 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700 disabled:opacity-60"
                    >
                      <Square size={14} aria-hidden="true" className="mr-1" /> End
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={rowBusy === d.id}
                    onClick={() => remove(d.id)}
                    className="inline-flex items-center rounded border border-line px-3 py-1.5 text-xs font-bold text-rose-700 hover:border-rose-300 disabled:opacity-60"
                  >
                    <Trash2 size={14} aria-hidden="true" className="mr-1" /> Delete
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={dialogOpen} onClose={() => setDialogOpen(false)} title="Deploy this exam">
        <div className="space-y-4">
          <label className="block text-sm font-semibold">Exam
            <select value={examId} onChange={(e) => setExamId(e.target.value)} className="mt-2 min-h-11 w-full rounded border border-line bg-white px-3 text-sm">
              <option value="">— Select an exam —</option>
              {(exams.data ?? []).map((x) => <option key={x.id} value={x.id}>{x.exam_name} ({x.minutes} mins)</option>)}
            </select>
          </label>
          <p className="text-xs leading-relaxed text-muted">
            Creates an <b>online</b> deployment with a join code. Press <b>Start</b> to go live immediately, or create a draft and start it later from the list.
          </p>
          {liveCode && (
            <p role="status" className="border border-lime-accent bg-brand-50 p-4 text-sm">
              <span className="font-extrabold text-brand-800">Live! Pupils join at:</span>
              <span className="mt-1 block font-mono text-base font-bold">/examination/{liveCode.code}</span>
            </p>
          )}
          {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setDialogOpen(false)} className="min-h-11 flex-1 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink">
              Close
            </button>
            <button type="button" disabled={busy || !examId} onClick={() => deploy(false)} className="min-h-11 flex-1 rounded border border-line px-4 text-sm font-bold hover:border-brand-500 hover:text-brand-700 disabled:opacity-60">
              {busy ? '…' : 'Save draft'}
            </button>
            <button type="button" disabled={busy || !examId} onClick={() => deploy(true)} className="inline-flex min-h-11 flex-1 items-center justify-center rounded bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
              <Plus aria-hidden="true" size={15} className="mr-1" /> {busy ? '…' : 'Start'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
