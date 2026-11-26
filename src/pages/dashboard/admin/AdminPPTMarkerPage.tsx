import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Camera,
  CheckCircle2,
  History,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  ScanLine,
  Trash2,
} from 'lucide-react';
import {
  Card,
  CardHead,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
  Pagination,
  Pill,
  TableWrap,
  Td,
  Th,
} from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { apiDelete, apiGet, apiPost } from '@/lib/api';
import { AnswerKeyModal } from './omr/AnswerKeyModal';
import { ScanReview } from './omr/ScanReview';
import {
  scoreTone,
  type OmrKeySummary,
  type OmrScanDetail,
  type OmrScanList,
} from './omr/types';

type Tab = 'scan' | 'keys' | 'history';

const TABS: Array<{ id: Tab; label: string; icon: typeof ScanLine }> = [
  { id: 'scan', label: 'Scan sheet', icon: ScanLine },
  { id: 'keys', label: 'Answer keys', icon: KeyRound },
  { id: 'history', label: 'History', icon: History },
];

const statusTone = (status: string): 'emerald' | 'amber' | 'rose' => {
  if (status === 'CONFIRMED') return 'emerald';
  if (status === 'FAILED') return 'rose';
  return 'amber';
};

const readableDate = (value: string | null | undefined) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
};

export const AdminPPTMarkerPage = () => {
  const [tab, setTab] = useState<Tab>('scan');

  const keys = useResource<{ rows: OmrKeySummary[]; total: number }>('/omr/keys');
  const keyRows = keys.data?.rows ?? [];

  const [selectedKeyId, setSelectedKeyId] = useState('');
  const [editingKey, setEditingKey] = useState<OmrKeySummary | null>(null);
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [imageData, setImageData] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [detail, setDetail] = useState<OmrScanDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const [historySearch, setHistorySearch] = useState('');
  const [historyStatus, setHistoryStatus] = useState('');
  const [historyKeyId, setHistoryKeyId] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLimit, setHistoryLimit] = useState(10);
  const history = useResource<OmrScanList>('/omr/scans', {
    page: historyPage,
    limit: historyLimit,
    search: historySearch.trim() || undefined,
    status: historyStatus || undefined,
    answerKeyId: historyKeyId || undefined,
  });

  useEffect(() => {
    if (!keyRows.length) {
      if (selectedKeyId) setSelectedKeyId('');
      return;
    }
    if (!keyRows.some((key) => key.id === selectedKeyId)) {
      setSelectedKeyId(keyRows[0].id);
    }
  }, [keyRows, selectedKeyId]);

  const selectedKey = keyRows.find((key) => key.id === selectedKeyId) ?? null;
  const historyPageCount = Math.max(1, Math.ceil((history.data?.total ?? 0) / historyLimit));

  const resetScanState = () => {
    setImageData(null);
    setPreviewUrl(null);
    setDetail(null);
    setScanError(null);
    setProcessing(false);
  };

  const openKeyModal = (key: OmrKeySummary | null) => {
    setEditingKey(key);
    setKeyModalOpen(true);
  };

  const onKeySaved = async () => {
    await keys.reload();
    setNotice(editingKey ? 'Answer key updated.' : 'Answer key created.');
    setActionError(null);
  };

  const deleteKey = async (key: OmrKeySummary) => {
    if (!window.confirm(`Delete “${key.title}” and all ${key.scanCount} scan(s) attached to it?`)) return;
    setActionError(null);
    try {
      await apiDelete(`/omr/keys/${key.id}`);
      await keys.reload();
      if (selectedKeyId === key.id) setSelectedKeyId('');
      history.reload();
      setNotice('Answer key deleted.');
    } catch (err: any) {
      setActionError(err?.message ?? 'Could not delete the answer key');
    }
  };

  const pickImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setScanError('Choose a photo or image file.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setScanError('That image is larger than 15 MB. Retake it at a lower resolution.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(String(reader.result));
      setPreviewUrl(String(reader.result));
      setDetail(null);
      setScanError(null);
      setNotice(null);
    };
    reader.onerror = () => setScanError('Could not read that image file.');
    reader.readAsDataURL(file);
  };

  const scanSheet = async () => {
    if (processing) return;
    if (!selectedKeyId) {
      setScanError('Create or select an answer key first.');
      return;
    }
    if (!imageData) {
      setScanError('Take a photo or choose an image of the completed sheet.');
      return;
    }
    setProcessing(true);
    setScanError(null);
    setNotice(null);
    try {
      const response = await apiPost<OmrScanDetail>('/omr/scans', {
        answerKeyId: selectedKeyId,
        image: imageData,
      });
      setDetail(response.data);
      setPreviewUrl(null);
      setImageData(null);
      await keys.reload();
      history.reload();
    } catch (err: any) {
      setScanError(err?.message ?? 'The sheet could not be read. Retake the photo and try again.');
    } finally {
      setProcessing(false);
    }
  };

  const openScan = async (id: string) => {
    setDetailLoading(true);
    setDetail(null);
    setScanError(null);
    setNotice(null);
    try {
      const response = await apiGet<OmrScanDetail>(`/omr/scans/${id}`);
      setDetail(response.data);
      setTab('scan');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setScanError(err?.message ?? 'Could not open that scan');
    } finally {
      setDetailLoading(false);
    }
  };

  const deleteScan = async (id: string) => {
    if (!window.confirm('Delete this scan and its images?')) return;
    try {
      await apiDelete(`/omr/scans/${id}`);
      if (detail?.id === id) resetScanState();
      history.reload();
      keys.reload();
      setNotice('Scan deleted.');
    } catch (err: any) {
      setActionError(err?.message ?? 'Could not delete the scan');
    }
  };

  const onConfirmed = (updated: OmrScanDetail) => {
    setDetail(updated);
    setNotice('Marks saved successfully.');
    history.reload();
    keys.reload();
  };

  const onDiscarded = () => {
    resetScanState();
    setNotice('Draft scan discarded.');
    history.reload();
    keys.reload();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Academics · OMR Marker"
        title="OMR / PPT Marker"
        text="Build paper answer keys, photograph completed bubble sheets and store the marks."
        actions={
          <>
            <Pill tone="emerald">Backend scanner ready</Pill>
            <button
              type="button"
              onClick={() => openKeyModal(null)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded bg-brand-900 px-4 text-xs font-bold text-white hover:bg-brand-700"
            >
              <Plus size={14} aria-hidden="true" /> New answer key
            </button>
          </>
        }
      />

      <div className="flex flex-wrap gap-2 border-b border-line pb-3" role="tablist" aria-label="OMR marker sections">
        {TABS.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.id)}
              className={`inline-flex min-h-9 items-center gap-1.5 rounded px-3 text-xs font-bold transition-colors ${
                active
                  ? 'bg-brand-900 text-white'
                  : 'border border-line bg-white text-ink hover:border-brand-400 hover:text-brand-700'
              }`}
            >
              <Icon size={14} aria-hidden="true" /> {item.label}
            </button>
          );
        })}
      </div>

      {notice && (
        <div className="flex items-center gap-2 border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800">
          <CheckCircle2 size={14} aria-hidden="true" /> {notice}
        </div>
      )}
      {actionError && (
        <div className="flex items-start gap-2 border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs text-rose-800">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" /> {actionError}
        </div>
      )}

      {tab === 'scan' && (
        <div className="space-y-4">
          {detail ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Scan result</p>
                <button
                  type="button"
                  onClick={resetScanState}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded border border-line bg-white px-3 text-xs font-bold text-ink hover:border-brand-500 hover:text-brand-700"
                >
                  <Camera size={13} aria-hidden="true" /> Scan another sheet
                </button>
              </div>
              <ScanReview detail={detail} onConfirmed={onConfirmed} onDiscarded={onDiscarded} />
            </div>
          ) : detailLoading ? (
            <Card className="p-6">
              <LoadingSkeleton rows={3} />
            </Card>
          ) : (
            <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
              <Card className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-brand-700">
                      1 · Choose the answer key
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      The key's subjects are read left → right on the sheet.
                    </p>
                  </div>
                  <Pill tone={selectedKey ? 'emerald' : 'amber'}>
                    {selectedKey ? `${selectedKey.subjects.length} subjects` : 'No key'}
                  </Pill>
                </div>

                {keys.loading ? (
                  <div className="mt-4">
                    <LoadingSkeleton rows={1} />
                  </div>
                ) : keys.error ? (
                  <div className="mt-4">
                    <ErrorState message={keys.error} onRetry={keys.reload} />
                  </div>
                ) : keyRows.length === 0 ? (
                  <div className="mt-4">
                    <EmptyState message="Create an answer key before scanning a sheet." />
                    <button
                      type="button"
                      onClick={() => openKeyModal(null)}
                      className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded bg-brand-900 px-4 text-xs font-bold text-white hover:bg-brand-700"
                    >
                      <Plus size={14} aria-hidden="true" /> Create the first key
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 space-y-2">
                    {keyRows.map((key) => {
                      const active = key.id === selectedKeyId;
                      return (
                        <button
                          key={key.id}
                          type="button"
                          onClick={() => setSelectedKeyId(key.id)}
                          className={`flex w-full items-center justify-between gap-3 rounded border px-3 py-2.5 text-left transition-colors ${
                            active
                              ? 'border-brand-500 bg-brand-50'
                              : 'border-line bg-white hover:border-brand-300'
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold text-ink">{key.title}</span>
                            <span className="block truncate text-[11px] text-muted">
                              {key.session ? `${key.session} · ` : ''}
                              {key.subjects.map((subject) => subject.name).join(' · ')}
                            </span>
                          </span>
                          <span className="shrink-0 text-[11px] font-medium text-muted">
                            {key.scanCount} scan{key.scanCount === 1 ? '' : 's'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <div className="mt-6 border-t border-line pt-5">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-brand-700">
                    2 · Photograph the completed sheet
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Fill the frame, keep the sheet flat and avoid shadows. The backend straightens the
                    page before reading bubbles.
                  </p>

                  <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded border-2 border-dashed border-brand-200 bg-brand-50/40 px-4 py-8 text-center transition-colors hover:border-brand-400 hover:bg-brand-50">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={pickImage}
                      className="sr-only"
                    />
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-900 text-white">
                      <Camera size={19} aria-hidden="true" />
                    </span>
                    <span className="text-sm font-bold text-ink">Take a photo or choose an image</span>
                    <span className="text-[11px] text-muted">JPEG, PNG or WebP · up to 15 MB</span>
                  </label>

                  {previewUrl && (
                    <div className="mt-4 rounded border border-line bg-white p-2">
                      <img
                        src={previewUrl}
                        alt="Selected sheet preview"
                        className="max-h-72 w-full rounded object-contain"
                      />
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-muted">Ready to scan · check the sheet is complete.</span>
                        <button
                          type="button"
                          onClick={() => {
                            setImageData(null);
                            setPreviewUrl(null);
                          }}
                          className="text-[11px] font-bold text-rose-700 hover:underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}

                  {processing && (
                    <div className="mt-4 flex items-center gap-3 rounded border border-brand-200 bg-brand-50 px-4 py-3 text-xs text-brand-800">
                      <RefreshCw size={15} className="animate-spin" aria-hidden="true" />
                      <div>
                        <p className="font-bold">Reading the sheet…</p>
                        <p className="text-[11px]">
                          Detecting the page and bubbles, then DeepSeek vision reads the header and checks
                          ambiguous marks. This can take up to a minute.
                        </p>
                      </div>
                    </div>
                  )}

                  {scanError && (
                    <p role="alert" className="mt-4 border-l-2 border-rose-400 bg-rose-50 px-3 py-2 text-xs text-rose-800">
                      {scanError}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={scanSheet}
                    disabled={processing || !imageData || !selectedKeyId}
                    className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded bg-brand-900 px-4 text-sm font-bold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ScanLine size={16} aria-hidden="true" />
                    {processing ? 'Scanning…' : 'Scan & read answers'}
                  </button>
                </div>
              </Card>

              <div className="space-y-4">
                <Card>
                  <CardHead title="How the scanner works" sub="A quick accuracy checklist" />
                  <ol className="space-y-3 px-5 py-4 text-xs leading-relaxed text-muted">
                    <li className="flex gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-700">1</span>
                      The page outline is detected and perspective-corrected to A4.
                    </li>
                    <li className="flex gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-700">2</span>
                      Bubble columns and rows are located with OpenCV, then each bubble's shading is measured.
                    </li>
                    <li className="flex gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-700">3</span>
                      DeepSeek vision reads the handwritten header, printed subject names and any ambiguous bubble rows.
                    </li>
                    <li className="flex gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-700">4</span>
                      Answers are scored against the key. AI corrections and uncertain marks stay flagged for you to review.
                    </li>
                    <li className="flex gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[10px] font-bold text-brand-700">5</span>
                      Check the header crop and student details, correct anything, then confirm. Nothing is final until you save.
                    </li>
                  </ol>
                </Card>
                <Card className="border-amber-200 bg-amber-50">
                  <div className="px-5 py-4 text-xs leading-relaxed text-amber-900">
                    <p className="flex items-center gap-1.5 font-bold">
                      <AlertTriangle size={13} aria-hidden="true" /> AI + human review
                    </p>
                    <p className="mt-1">
                      The AI pre-fills names, emails and phone numbers from the handwriting and double-checks
                      uncertain bubbles. Always verify its suggestions before saving — the final answer is yours.
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'keys' && (
        <Card>
          <CardHead
            title="Answer keys"
            sub="One key per paper. Subjects must match the sheet order."
          />
          {keys.loading ? (
            <div className="p-5">
              <LoadingSkeleton rows={4} />
            </div>
          ) : keys.error ? (
            <div className="p-5">
              <ErrorState message={keys.error} onRetry={keys.reload} />
            </div>
          ) : keyRows.length === 0 ? (
            <div className="p-5">
              <EmptyState message="No answer keys yet. Create one to start scanning sheets." />
              <button
                type="button"
                onClick={() => openKeyModal(null)}
                className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded bg-brand-900 px-4 text-xs font-bold text-white hover:bg-brand-700"
              >
                <Plus size={14} aria-hidden="true" /> New answer key
              </button>
            </div>
          ) : (
            <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
              {keyRows.map((key) => (
                <article key={key.id} className="flex flex-col border border-line bg-white">
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-ink">{key.title}</h3>
                        <p className="mt-0.5 truncate text-[11px] text-muted">
                          {key.session || 'No session set'}
                        </p>
                      </div>
                      <Pill tone={key.isActive ? 'emerald' : 'amber'}>
                        {key.isActive ? 'Active' : 'Paused'}
                      </Pill>
                    </div>
                    <div className="mt-3 space-y-1.5">
                      {key.subjects.map((subject, index) => (
                        <div key={`${key.id}-${subject.id ?? index}`} className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="truncate text-ink">
                            <span className="mr-1 font-bold text-brand-700">{index + 1}.</span>
                            {subject.name}
                          </span>
                          <span className="shrink-0 text-muted">
                            {subject.answers.filter(Boolean).length}/{subject.questionCount} set
                          </span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-[11px] text-muted">
                      {key.scanCount} scan{key.scanCount === 1 ? '' : 's'} · {readableDate(key.updatedAt)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 border-t border-line px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedKeyId(key.id);
                        setTab('scan');
                      }}
                      className="inline-flex min-h-8 items-center gap-1 rounded bg-brand-900 px-3 text-[11px] font-bold text-white hover:bg-brand-700"
                    >
                      Use for scanning <ArrowRight size={11} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openKeyModal(key)}
                      className="inline-flex min-h-8 items-center gap-1 rounded border border-line px-3 text-[11px] font-bold text-ink hover:border-brand-500"
                    >
                      <Pencil size={11} aria-hidden="true" /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteKey(key)}
                      className="inline-flex min-h-8 items-center gap-1 rounded border border-rose-200 px-3 text-[11px] font-bold text-rose-700 hover:bg-rose-50"
                    >
                      <Trash2 size={11} aria-hidden="true" /> Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'history' && (
        <Card>
          <CardHead title="Scan history" sub="Confirmed marks and drafts from this workspace." />
          <div className="flex flex-wrap items-end gap-2 border-b border-line px-5 py-3">
            <label className="text-[11px] font-bold uppercase tracking-widest text-brand-700">
              Search
              <input
                value={historySearch}
                onChange={(event) => {
                  setHistorySearch(event.target.value);
                  setHistoryPage(1);
                }}
                placeholder="Student, email or university"
                className="mt-1 block min-h-9 w-56 rounded border border-line bg-white px-3 text-xs font-normal normal-case tracking-normal text-ink outline-none focus:border-brand-500"
              />
            </label>
            <label className="text-[11px] font-bold uppercase tracking-widest text-brand-700">
              Status
              <select
                value={historyStatus}
                onChange={(event) => {
                  setHistoryStatus(event.target.value);
                  setHistoryPage(1);
                }}
                className="mt-1 block min-h-9 rounded border border-line bg-white px-2 text-xs font-normal normal-case tracking-normal text-ink outline-none focus:border-brand-500"
              >
                <option value="">All</option>
                <option value="DRAFT">Draft</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="FAILED">Failed</option>
              </select>
            </label>
            <label className="text-[11px] font-bold uppercase tracking-widest text-brand-700">
              Answer key
              <select
                value={historyKeyId}
                onChange={(event) => {
                  setHistoryKeyId(event.target.value);
                  setHistoryPage(1);
                }}
                className="mt-1 block min-h-9 max-w-56 rounded border border-line bg-white px-2 text-xs font-normal normal-case tracking-normal text-ink outline-none focus:border-brand-500"
              >
                <option value="">All keys</option>
                {keyRows.map((key) => (
                  <option key={key.id} value={key.id}>
                    {key.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {history.loading ? (
            <div className="p-5">
              <LoadingSkeleton rows={5} />
            </div>
          ) : history.error ? (
            <div className="p-5">
              <ErrorState message={history.error} onRetry={history.reload} />
            </div>
          ) : (history.data?.rows.length ?? 0) === 0 ? (
            <div className="p-5">
              <EmptyState message="No scanned sheets match these filters." />
            </div>
          ) : (
            <>
              <TableWrap>
                <thead>
                  <tr>
                    <Th>Student</Th>
                    <Th>Answer key</Th>
                    <Th>Score</Th>
                    <Th>Status</Th>
                    <Th>Scanned</Th>
                    <Th>Actions</Th>
                  </tr>
                </thead>
                <tbody>
                  {(history.data?.rows ?? []).map((scan) => (
                    <tr key={scan.id} className="hover:bg-brand-50/30">
                      <Td>
                        <p className="text-sm font-bold text-ink">{scan.studentName || 'Unnamed scan'}</p>
                        <p className="text-[11px] text-muted">{scan.studentEmail || 'No email captured'}</p>
                      </Td>
                      <Td>
                        <p className="text-xs font-medium text-ink">{scan.answerKeyTitle || '—'}</p>
                        <p className="text-[11px] text-muted">{scan.university || ''}</p>
                      </Td>
                      <Td>
                        <Pill tone={scoreTone(scan.percentage)}>{scan.percentage}%</Pill>
                        <p className="mt-1 text-[11px] text-muted">
                          {scan.totalScore}/{scan.totalQuestions}
                        </p>
                      </Td>
                      <Td>
                        <Pill tone={statusTone(scan.status)}>{scan.status.toLowerCase()}</Pill>
                      </Td>
                      <Td>
                        <span className="text-[11px] text-muted">{readableDate(scan.createdAt)}</span>
                      </Td>
                      <Td>
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() => openScan(scan.id)}
                            className="min-h-8 rounded border border-line px-2.5 text-[11px] font-bold text-ink hover:border-brand-500 hover:text-brand-700"
                          >
                            Open
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteScan(scan.id)}
                            className="min-h-8 rounded border border-rose-200 px-2.5 text-[11px] font-bold text-rose-700 hover:bg-rose-50"
                          >
                            Delete
                          </button>
                        </div>
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </TableWrap>
              <Pagination
                total={history.data?.total ?? 0}
                page={history.data?.page ?? historyPage}
                pageCount={historyPageCount}
                limit={historyLimit}
                onPage={setHistoryPage}
                onLimit={(next) => {
                  setHistoryLimit(next);
                  setHistoryPage(1);
                }}
                noun="scan(s)"
              />
            </>
          )}
        </Card>
      )}

      <AnswerKeyModal
        open={keyModalOpen}
        onClose={() => setKeyModalOpen(false)}
        initial={editingKey}
        onSaved={onKeySaved}
      />
    </div>
  );
};

export default AdminPPTMarkerPage;
