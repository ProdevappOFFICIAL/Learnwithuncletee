import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardHead, EmptyState, ErrorState, LoadingSkeleton, Modal, PageHeader, Pagination, Pill } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api';
import { usePagedList } from '@/lib/pagedQuery';
import type { ClassItem, ExamDeploymentItem, ExamItem, SubjectItem } from '@/data/dashboard';
import { CheckSquare, Cloud, CloudOff, Copy, Play, Plus, Settings2, Square, Trash2 } from 'lucide-react';

type ModeFilter = '' | 'ONLINE' | 'OFFLINE';

interface OfflineDeployment extends ExamDeploymentItem {
  scope?: { classIds?: string[]; examIds?: string[]; subjectIds?: string[] } | null;
}

interface SubjectRow extends SubjectItem {
  exams?: Array<{ id: string; exam_name: string }>;
}

interface ExamRow extends ExamItem {
  classId: string;
  class?: { name: string } | null;
}

const checkRow = 'flex cursor-pointer items-center gap-2.5 rounded border border-line px-3 py-2 text-sm hover:border-brand-500';

export const DeploymentsPage = () => {
  const [modeFilter, setModeFilter] = useState<ModeFilter>('');
  const list = usePagedList<OfflineDeployment>(
    ['deployments', modeFilter],
    (page, limit) => apiGet<OfflineDeployment[]>('/exam-deployments', { mode: modeFilter || undefined, page, limit }),
  );
  const exams = useResource<ExamRow[]>('/exams', { limit: 200 });
  const classes = useResource<ClassItem[]>('/classes', { limit: 200 });
  const subjects = useResource<SubjectRow[]>('/subjects', { limit: 200 });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [examId, setExamId] = useState('');
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [liveCode, setLiveCode] = useState<{ code: string; id: string } | null>(null);

  // ── Offline composer state ────────────────────────────────────────────────
  const [offlineOpen, setOfflineOpen] = useState(false);
  const [selClasses, setSelClasses] = useState<string[]>([]);
  const [selExams, setSelExams] = useState<string[]>([]);
  const [selSubjects, setSelSubjects] = useState<string[]>([]);

  // ── Subject gear (per offline deployment) ─────────────────────────────────
  const [gearFor, setGearFor] = useState<OfflineDeployment | null>(null);
  const [gearSubjects, setGearSubjects] = useState<string[]>([]);

  const examList = useMemo(() => exams.data ?? [], [exams.data]);
  const classList = useMemo(() => classes.data ?? [], [classes.data]);
  const subjectList = useMemo(() => subjects.data ?? [], [subjects.data]);
  const classNameOf = (id: string) => classList.find((c) => c.id === id)?.name ?? 'Class';

  const examsByClass = useMemo(() => {
    const map = new Map<string, ExamRow[]>();
    for (const e of examList) {
      if (!selClasses.includes(e.classId)) continue;
      const arr = map.get(e.classId) ?? [];
      arr.push(e);
      map.set(e.classId, arr);
    }
    return [...map.entries()];
  }, [examList, selClasses]);

  const composerSubjects = useMemo(() => {
    if (selExams.length === 0) return [];
    return subjectList.filter((s) => (s.exams ?? []).some((e) => selExams.includes(e.id)));
  }, [subjectList, selExams]);

  const toggle = (arr: string[], id: string) => (arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]);

  const toggleClass = (id: string) => {
    const next = toggle(selClasses, id);
    setSelClasses(next);
    if (!next.includes(id)) {
      // Unchecking a class drops its exams (and now-orphaned subject picks stay harmless).
      const classExamIds = new Set(examList.filter((e) => e.classId === id).map((e) => e.id));
      setSelExams((prev) => prev.filter((x) => !classExamIds.has(x)));
    }
  };

  const toggleAllInClass = (classId: string) => {
    const ids = examList.filter((e) => e.classId === classId).map((e) => e.id);
    const allOn = ids.every((x) => selExams.includes(x));
    setSelExams((prev) => (allOn ? prev.filter((x) => !ids.includes(x)) : [...new Set([...prev, ...ids])]));
  };

  const openOffline = () => {
    setSelClasses([]);
    setSelExams([]);
    setSelSubjects([]);
    setLiveCode(null);
    setNotice(null);
    setOfflineOpen(true);
  };

  const deployOffline = async (startNow: boolean) => {
    if (selExams.length === 0) {
      setNotice('Select at least one class and exam first.');
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const res = await apiPost<OfflineDeployment>('/exam-deployments', {
        mode: 'OFFLINE',
        scope: { classIds: selClasses, examIds: selExams, subjectIds: selSubjects },
      });
      if (startNow) {
        const started = await apiPost<OfflineDeployment>(`/exam-deployments/${res.data.id}/start`, {});
        setLiveCode({ code: started.data.code, id: started.data.id });
        setNotice(`Offline deployment LIVE — enter code ${started.data.code} in the desktop host app.`);
      } else {
        setNotice(`Offline draft created (${res.data.code}). Start it when ready.`);
      }
      setSelClasses([]);
      setSelExams([]);
      setSelSubjects([]);
      list.invalidate();
    } catch (err: any) {
      setNotice(err?.message ?? 'Deploy failed');
    } finally {
      setBusy(false);
    }
  };

  const openGear = (d: OfflineDeployment) => {
    setGearFor(d);
    setGearSubjects(d.scope?.subjectIds ?? []);
    setNotice(null);
  };

  const gearOptions = useMemo(() => {
    if (!gearFor) return [];
    const examIds = gearFor.scope?.examIds?.length
      ? gearFor.scope.examIds
      : gearFor.exam?.id
        ? [gearFor.exam.id]
        : [];
    if (!examIds.length) return subjectList;
    return subjectList.filter((s) => (s.exams ?? []).some((e) => examIds.includes(e.id)));
  }, [gearFor, subjectList]);

  const saveGear = async () => {
    if (!gearFor) return;
    setBusy(true);
    try {
      await apiPatch(`/exam-deployments/${gearFor.id}/scope`, { scope: { subjectIds: gearSubjects } });
      setNotice(`Subjects updated for ${gearFor.code} (${gearSubjects.length === 0 ? 'all subjects' : `${gearSubjects.length} selected`}).`);
      setGearFor(null);
      list.invalidate();
    } catch (err: any) {
      setNotice(err?.message ?? 'Could not update subjects');
    } finally {
      setBusy(false);
    }
  };

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
      list.invalidate();
    } catch (err: any) {
      setNotice(err?.message ?? 'Deploy failed');
    } finally {
      setBusy(false);
    }
  };

  const startRow = async (d: OfflineDeployment) => {
    setRowBusy(d.id);
    try {
      const res = await apiPost<OfflineDeployment>(`/exam-deployments/${d.id}/start`, {});
      setNotice(
        d.mode === 'OFFLINE'
          ? `Offline deployment LIVE — enter code ${res.data.code} in the desktop host app.`
          : `Deployment is LIVE — code ${res.data.code}.`,
      );
      list.invalidate();
    } catch (err: any) {
      setNotice(err?.message ?? 'Could not start');
    } finally {
      setRowBusy(null);
    }
  };

  const end = async (id: string) => {
    if (!confirm('End this deployment? Pupils will no longer be able to join.')) return;
    setRowBusy(id);
    try {
      await apiPost(`/exam-deployments/${id}/end`, {});
      list.invalidate();
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
      list.invalidate();
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

  const scopeSummary = (d: OfflineDeployment) => {
    const s = d.scope;
    if (!s) return d.exam?.exam_name ?? 'Single exam';
    const bits: string[] = [];
    if (s.classIds?.length) bits.push(`${s.classIds.length} class${s.classIds.length === 1 ? '' : 'es'}`);
    if (s.examIds?.length) bits.push(`${s.examIds.length} exam${s.examIds.length === 1 ? '' : 's'}`);
    bits.push(s.subjectIds?.length ? `${s.subjectIds.length} subjects` : 'all subjects');
    return bits.join(' · ');
  };

  const statusTone = (s: string) => (s === 'LIVE' ? 'emerald' : s === 'ENDED' ? 'rose' : 'amber') as 'emerald' | 'rose' | 'amber';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Exam & Test"
        title="Deployments"
        text="Put an exam live so pupils can sit it at /examination/:code, or pack an offline bundle for the desktop host app."
      />
      {notice && !dialogOpen && !offlineOpen && !gearFor && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}

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
        <button
          type="button"
          onClick={openOffline}
          className="border border-line bg-white p-6 text-left hover:border-brand-500"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-900 text-white">
            <CloudOff size={22} aria-hidden="true" />
          </span>
          <span className="mt-4 block font-display text-xl font-extrabold">Offline deployment</span>
          <span className="mt-1 block text-sm text-muted">Pack classes + exams + subjects for the desktop host app. Pupils sit over LAN; results sync back later.</span>
          <span className="mt-4 inline-block text-sm font-bold text-brand-700">Build offline bundle →</span>
        </button>
      </div>

      <Card>
        <CardHead title="Deployments" sub={`${list.total} — all modes and states`} />
        <div className="flex flex-wrap gap-2 border-b border-line px-5 py-4" role="group" aria-label="Filter by mode">
          {(['', 'ONLINE', 'OFFLINE'] as ModeFilter[]).map((m) => (
            <button
              key={m || 'all'}
              type="button"
              onClick={() => { setModeFilter(m); list.resetPage(); }}
              aria-pressed={modeFilter === m}
              className={`min-h-10 rounded px-4 py-2 text-sm font-semibold ${modeFilter === m ? 'bg-brand-700 text-white' : 'border border-line text-muted hover:border-brand-500 hover:text-brand-700'}`}
            >
              {m === '' ? 'All' : m === 'ONLINE' ? 'Online' : 'Offline'}
            </button>
          ))}
        </div>
        {list.isPending ? (
          <div className="px-5 py-5"><LoadingSkeleton rows={4} /></div>
        ) : list.isError ? (
          <div className="px-5 py-5"><ErrorState message="Could not load deployments" onRetry={() => list.refetch()} /></div>
        ) : list.rows.length === 0 ? (
          <div className="px-5 py-5"><EmptyState message="No deployments yet. Deploy an exam to get a join code." /></div>
        ) : (
          <>
            <ul className={`divide-y divide-line transition-opacity ${list.isFetching ? 'opacity-60' : ''}`}>
              {list.rows.map((d) => (
                <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
                      {d.mode === 'OFFLINE' ? 'Offline bundle' : (d.exam?.exam_name ?? 'Exam')}
                      <Pill tone={d.mode === 'ONLINE' ? 'sky' : 'amber'}>{d.mode}</Pill>
                      <Pill tone={statusTone(d.status)}>{d.status}</Pill>
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                      <span className="font-mono font-bold text-ink">{d.code}</span>
                      <button type="button" onClick={() => copyCode(d.code)} aria-label={`Copy code ${d.code}`} title="Copy code" className="inline-flex items-center gap-1 font-bold text-brand-700 hover:underline">
                        <Copy size={12} aria-hidden="true" /> Copy
                      </button>
                      <span>·</span>
                      {d.mode === 'ONLINE' ? (
                        <Link to={`/examination/${d.code}`} className="font-bold text-brand-700 hover:underline">/examination/{d.code}</Link>
                      ) : (
                        <span title="Enter this code in the desktop host app">Host app code — LAN server defaults to :8787</span>
                      )}
                    </p>
                    {d.mode === 'OFFLINE' && <p className="mt-1 text-xs text-muted">{scopeSummary(d)}</p>}
                  </div>
                  <span className="flex shrink-0 items-center gap-2">
                    {d.mode === 'OFFLINE' && (
                      <button
                        type="button"
                        onClick={() => openGear(d)}
                        aria-label={`Filter subjects for ${d.code}`}
                        title="Filter subjects"
                        className="inline-flex items-center rounded border border-line px-3 py-1.5 text-xs font-bold hover:border-brand-500 hover:text-brand-700"
                      >
                        <Settings2 size={14} aria-hidden="true" />
                      </button>
                    )}
                    {d.status !== 'LIVE' && d.status !== 'ENDED' && (
                      <button
                        type="button"
                        disabled={rowBusy === d.id}
                        onClick={() => startRow(d)}
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
            <Pagination
              total={list.total}
              page={list.page}
              pageCount={list.pageCount}
              limit={list.limit}
              onPage={list.setPage}
              onLimit={list.setLimit}
              disabled={list.isFetching}
              noun="deployment(s)"
            />
          </>
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

      <Modal open={offlineOpen} onClose={() => setOfflineOpen(false)} title="Offline bundle">
        <div className="space-y-5">
          <div>
            <p className="text-sm font-semibold">1 · Classes <span className="font-normal text-muted">(tick any)</span></p>
            <div className="mt-2 grid max-h-44 gap-1.5 overflow-y-auto">
              {classList.map((c) => (
                <label key={c.id} className={checkRow}>
                  <input type="checkbox" checked={selClasses.includes(c.id)} onChange={() => toggleClass(c.id)} className="h-4 w-4 accent-brand-700" />
                  <span className="font-semibold">{c.name}</span>
                </label>
              ))}
              {classList.length === 0 && <p className="text-xs text-muted">No classes found.</p>}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold">2 · Exams <span className="font-normal text-muted">(one class + all its exams, or hand-picked)</span></p>
            {selClasses.length === 0 ? (
              <p className="mt-2 text-xs text-muted">Select classes above to list their exams.</p>
            ) : (
              <div className="mt-2 space-y-3">
                {examsByClass.map(([classId, items]) => (
                  <div key={classId}>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-widest text-brand-700">{classNameOf(classId)}</p>
                      <button type="button" onClick={() => toggleAllInClass(classId)} className="inline-flex items-center gap-1 text-xs font-bold text-brand-700 hover:underline">
                        <CheckSquare size={13} aria-hidden="true" />
                        {items.every((x) => selExams.includes(x.id)) ? 'Clear all' : 'All in class'}
                      </button>
                    </div>
                    <div className="mt-1.5 grid gap-1.5">
                      {items.map((x) => (
                        <label key={x.id} className={checkRow}>
                          <input type="checkbox" checked={selExams.includes(x.id)} onChange={() => setSelExams((prev) => toggle(prev, x.id))} className="h-4 w-4 accent-brand-700" />
                          <span className="font-semibold">{x.exam_name}</span>
                          <span className="ml-auto text-xs text-muted">{x.minutes} mins</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold">3 · Subjects <span className="font-normal text-muted">(leave all unticked = every subject)</span></p>
            {selExams.length === 0 ? (
              <p className="mt-2 text-xs text-muted">Select exams to list their subjects — or leave blank for all subjects.</p>
            ) : composerSubjects.length === 0 ? (
              <p className="mt-2 text-xs text-muted">No subjects linked to the selected exams — the bundle will carry all of them.</p>
            ) : (
              <div className="mt-2 grid max-h-44 gap-1.5 overflow-y-auto">
                {composerSubjects.map((s) => (
                  <label key={s.id} className={checkRow}>
                    <input type="checkbox" checked={selSubjects.includes(s.id)} onChange={() => setSelSubjects((prev) => toggle(prev, s.id))} className="h-4 w-4 accent-brand-700" />
                    <span className="font-semibold">{s.name}</span>
                    {s.code && <span className="ml-auto text-xs text-muted">{s.code}</span>}
                  </label>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs leading-relaxed text-muted">
            Bundle: <b>{selClasses.length}</b> classes · <b>{selExams.length}</b> exams · <b>{selSubjects.length === 0 ? 'all' : selSubjects.length}</b> subjects.
            The host app downloads it by code and serves pupils over LAN.
          </p>
          {liveCode && (
            <p role="status" className="border border-lime-accent bg-brand-50 p-4 text-sm">
              <span className="font-extrabold text-brand-800">Live! Enter this code in the host app:</span>
              <span className="mt-1 block font-mono text-base font-bold">{liveCode.code}</span>
            </p>
          )}
          {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setOfflineOpen(false)} className="min-h-11 flex-1 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink">
              Close
            </button>
            <button type="button" disabled={busy || selExams.length === 0} onClick={() => deployOffline(false)} className="min-h-11 flex-1 rounded border border-line px-4 text-sm font-bold hover:border-brand-500 hover:text-brand-700 disabled:opacity-60">
              {busy ? '…' : 'Save draft'}
            </button>
            <button type="button" disabled={busy || selExams.length === 0} onClick={() => deployOffline(true)} className="inline-flex min-h-11 flex-1 items-center justify-center rounded bg-brand-900 px-4 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
              <Plus aria-hidden="true" size={15} className="mr-1" /> {busy ? '…' : 'Start'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={gearFor !== null} onClose={() => setGearFor(null)} title={`Subjects — ${gearFor?.code ?? ''}`}>
        <div className="space-y-4">
          <p className="text-xs leading-relaxed text-muted">
            Tick the subjects this deployment serves. <b>Untick everything for all subjects.</b>
          </p>
          <div className="grid max-h-64 gap-1.5 overflow-y-auto">
            {gearOptions.map((s) => (
              <label key={s.id} className={checkRow}>
                <input type="checkbox" checked={gearSubjects.includes(s.id)} onChange={() => setGearSubjects((prev) => toggle(prev, s.id))} className="h-4 w-4 accent-brand-700" />
                <span className="font-semibold">{s.name}</span>
                {s.code && <span className="ml-auto text-xs text-muted">{s.code}</span>}
              </label>
            ))}
            {gearOptions.length === 0 && <p className="text-xs text-muted">No subjects linked to this deployment's exams.</p>}
          </div>
          {notice && <p role="status" className="border-l-2 border-lime-accent bg-brand-50 px-4 py-3 text-sm text-brand-800">{notice}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setGearFor(null)} className="min-h-11 flex-1 rounded border border-line px-4 text-sm font-bold text-muted hover:text-ink">
              Cancel
            </button>
            <button type="button" disabled={busy} onClick={saveGear} className="min-h-11 flex-1 rounded bg-brand-500 px-4 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
              {busy ? 'Saving…' : 'Save subjects'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
