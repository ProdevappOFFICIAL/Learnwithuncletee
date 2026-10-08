import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageMetadata } from '@/components/ui/PageMetadata';
import { apiGet, apiPost } from '@/lib/api';
import { ROUTES } from '@/routes/paths';
import { siteInfo } from '@/data/content';
import {
  AlertTriangle,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Clock,
  Delete,
  Send,
  X,
} from 'lucide-react';
import type { ExamQuestion, LiveExam } from './ExaminationPage';

const NewsContent = lazy(() => import('@/lib/mdxEditor').then((m) => ({ default: m.NewsContent })));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const fmtTime = (secs: number) => {
  const m = Math.floor(Math.max(0, secs) / 60);
  const s = Math.max(0, secs) % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

// ─── Calculator Dialog ────────────────────────────────────────────────────────

const CALC_BUTTONS = [
  ['C', '±', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '⌫', '='],
] as const;

type CalcBtn = (typeof CALC_BUTTONS)[number][number];

const CalculatorDialog = ({ onClose }: { onClose: () => void }) => {
  const [display, setDisplay] = useState('0');
  const [prev, setPrev] = useState<string | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [fresh, setFresh] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const press = useCallback(
    (btn: CalcBtn) => {
      const cur = display;
      if (btn === 'C') { setDisplay('0'); setPrev(null); setOp(null); setFresh(false); return; }
      if (btn === '⌫') { setDisplay(cur.length > 1 ? cur.slice(0, -1) : '0'); return; }
      if (btn === '±') { setDisplay(String(parseFloat(cur) * -1)); return; }
      if (btn === '%') { setDisplay(String(parseFloat(cur) / 100)); return; }
      if (btn === '÷' || btn === '×' || btn === '−' || btn === '+') {
        setPrev(cur); setOp(btn); setFresh(true); return;
      }
      if (btn === '=') {
        if (!op || !prev) return;
        const a = parseFloat(prev), b = parseFloat(cur);
        let res: number;
        switch (op) {
          case '÷': res = b !== 0 ? a / b : 0; break;
          case '×': res = a * b; break;
          case '−': res = a - b; break;
          default:  res = a + b;
        }
        setDisplay(parseFloat(res.toPrecision(12)).toString());
        setPrev(null); setOp(null); setFresh(false); return;
      }
      if (btn === '.') {
        if (fresh) { setDisplay('0.'); setFresh(false); return; }
        if (!cur.includes('.')) setDisplay(cur + '.');
        return;
      }
      if (fresh || cur === '0') { setDisplay(btn); setFresh(false); }
      else { if (cur.replace('-', '').replace('.', '').length >= 12) return; setDisplay(cur + btn); }
    },
    [display, op, prev, fresh],
  );

  const isOp = (b: CalcBtn) => b === '÷' || b === '×' || b === '−' || b === '+';
  const isAction = (b: CalcBtn) => b === 'C' || b === '±' || b === '%';
  const isEq = (b: CalcBtn) => b === '=';

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-label="Calculator">
      <button type="button" aria-label="Close calculator" onClick={onClose} className="absolute inset-0 bg-brand-900/50" />
      <div className="relative w-72 overflow-hidden rounded-xl bg-brand-900 shadow-2xl ring-1 ring-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 text-white/60">
            <Calculator size={14} aria-hidden="true" />
            <span className="text-xs font-semibold uppercase tracking-widest">Calculator</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Close calculator" className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/60 hover:bg-white/20 hover:text-white">
            <X size={13} aria-hidden="true" />
          </button>
        </div>
        <div className="px-4 pb-3 pt-1 text-right">
          {op && prev && <p className="mb-0.5 font-mono text-xs text-white/40">{prev} {op}</p>}
          <p className="font-mono text-4xl font-bold tracking-tight text-white" aria-live="polite" aria-label={`Display: ${display}`}>
            {display.length > 10 ? parseFloat(display).toExponential(4) : display}
          </p>
        </div>
        <div className="mx-4 border-t border-white/10" />
        <div className="grid grid-cols-4 gap-px bg-white/10 p-px">
          {CALC_BUTTONS.flat().map((btn, i) => (
            <button
              key={i}
              type="button"
              aria-label={btn === '⌫' ? 'Backspace' : btn}
              onClick={() => press(btn as CalcBtn)}
              className={[
                'flex min-h-[58px] items-center justify-center text-lg font-semibold transition-colors active:scale-95',
                isEq(btn as CalcBtn) ? 'bg-lime-accent text-brand-900 hover:bg-white'
                  : isOp(btn as CalcBtn) ? 'bg-brand-500/80 text-white hover:bg-brand-500'
                  : isAction(btn as CalcBtn) || btn === '⌫' ? 'bg-white/15 text-white/80 hover:bg-white/25'
                  : 'bg-brand-800 text-white hover:bg-brand-700',
              ].join(' ')}
            >
              {btn === '⌫' ? <Delete size={18} aria-hidden="true" /> : btn}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Anti-cheat warning overlay ───────────────────────────────────────────────

const WarningOverlay = ({
  count,
  onDismiss,
  onSubmitNow,
}: {
  count: number;
  onDismiss: () => void;
  onSubmitNow: () => void;
}) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-900/80 p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-labelledby="warn-title">
    <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-2xl">
      <div className="flex items-start gap-4 bg-rose-600 px-5 py-4 text-white">
        <AlertTriangle size={22} strokeWidth={2} aria-hidden="true" className="mt-0.5 shrink-0" />
        <div>
          <h2 id="warn-title" className="font-display text-base font-extrabold">Exam integrity warning</h2>
          <p className="mt-0.5 text-sm text-white/80">Switching away is not allowed during an examination.</p>
        </div>
      </div>
      <div className="px-5 py-4">
        <p className="text-sm text-ink">
          You left this tab or minimised the window. This has been recorded.{' '}
          <strong>Violation {count} of 3</strong> — on the 3rd violation your exam will be submitted automatically.
        </p>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={onSubmitNow}
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100"
          >
            Submit now
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded bg-brand-500 px-3 py-2 text-sm font-bold text-white hover:bg-brand-700"
            autoFocus
          >
            Return to exam
          </button>
        </div>
      </div>
    </div>
  </div>
);

// ─── Submit confirmation dialog ───────────────────────────────────────────────

const SubmitConfirm = ({
  total,
  answeredCount,
  busy,
  onCancel,
  onConfirm,
}: {
  total: number;
  answeredCount: number;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  const left = total - answeredCount;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-900/80 p-4 backdrop-blur-sm" role="alertdialog" aria-modal="true" aria-labelledby="submit-title">
      <div className="w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="px-5 py-4">
          <h2 id="submit-title" className="font-display text-base font-extrabold">Submit examination?</h2>
          <p className="mt-2 text-sm text-ink">
            You answered <strong>{answeredCount} of {total}</strong>
            {left > 0 ? (
              <>, <strong className="text-rose-700">{left} unanswered</strong> — unanswered questions score zero.</>
            ) : (
              <>. Every question answered — well done.</>
            )}
          </p>
          <p className="mt-1 text-xs text-muted">This cannot be undone.</p>
        </div>
        <div className="flex gap-3 px-5 pb-5">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex min-h-10 flex-1 items-center justify-center rounded border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-brand-500 hover:text-brand-700"
            autoFocus
          >
            Keep answering
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded bg-brand-500 px-3 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            <Send size={15} aria-hidden="true" />
            {busy ? 'Submitting…' : 'Submit now'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Small keyboard-hint chip ─────────────────────────────────────────────────

const Kbd = ({ children }: { children: string }) => (
  <kbd className="rounded border border-line bg-white px-1.5 py-0.5 font-mono text-[11px] font-bold text-ink">{children}</kbd>
);

// ─── Session payload stored by ExaminationPage on login ───────────────────────

interface ExamSession {
  exam: LiveExam['exam'];
  questions: ExamQuestion[];
  gate?: { className: string; combinationName: string | null } | null;
  userId: string;
  startedAt: number; // Date.now() ms
}

interface RoomProgress {
  picked: Record<string, number | null>;
  typed: Record<string, string>;
  currentQ: number;
}

const readProgress = (key: string): RoomProgress => {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return { picked: {}, typed: {}, currentQ: 0 };
    const p = JSON.parse(raw) as Partial<RoomProgress>;
    return {
      picked: p.picked && typeof p.picked === 'object' ? p.picked : {},
      typed: p.typed && typeof p.typed === 'object' ? p.typed : {},
      currentQ: typeof p.currentQ === 'number' && p.currentQ >= 0 ? p.currentQ : 0,
    };
  } catch {
    return { picked: {}, typed: {}, currentQ: 0 };
  }
};

// ─── ExamRoomPage ─────────────────────────────────────────────────────────────

export const ExamRoomPage = () => {
  const { code = '' } = useParams<{ code: string }>();
  const sessionKey = `exam_session_${code}`;

  // ── Hydrate from sessionStorage ─────────────────────────────────────────────
  const session = useMemo<ExamSession | null>(() => {
    try {
      const raw = sessionStorage.getItem(sessionKey);
      return raw ? (JSON.parse(raw) as ExamSession) : null;
    } catch { return null; }
  }, [sessionKey]);

  const exam = session?.exam ?? null;
  const userId = session?.userId ?? null;
  // New sessions carry questions separately (filtered + answers stripped);
  // fall back to exam-embedded rows for legacy in-flight sessions.
  const questions: ExamQuestion[] = useMemo(
    () => session?.questions ?? ((session?.exam as any)?.questions ?? []),
    [session],
  );

  // If no valid session, redirect back to login
  useEffect(() => {
    if (!session) {
      window.location.replace(ROUTES.examination.replace(':code', code));
    }
  }, [session, code]);

  // ── Answer state (persisted so a tab reload resumes, timer keeps running) ────
  const progressKey = `${sessionKey}:progress`;
  const [picked, setPicked] = useState<Record<string, number | null>>(() => readProgress(progressKey).picked);
  const [typed, setTyped] = useState<Record<string, string>>(() => readProgress(progressKey).typed);
  const [currentQ, setCurrentQ] = useState(() => readProgress(progressKey).currentQ);
  const [calcOpen, setCalcOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.setItem(progressKey, JSON.stringify({ picked, typed, currentQ }));
    } catch {
      /* private mode — resume unavailable, exam still works */
    }
  }, [picked, typed, currentQ, progressKey]);

  // ── Sitter avatar (top-right) ───────────────────────────────────────────────
  const [sitter, setSitter] = useState<{ user_name: string; img?: string | null; student?: { photoUrl?: string | null } | null } | null>(null);
  useEffect(() => {
    let cancelled = false;
    apiGet<{ user_name: string; img?: string | null; student?: { photoUrl?: string | null } | null }>('/dashboard/me')
      .then((res) => { if (!cancelled) setSitter(res.data); })
      .catch(() => { /* avatar is decorative — exam works without it */ });
    return () => { cancelled = true; };
  }, []);

  // ── Timer ───────────────────────────────────────────────────────────────────
  const [secondsLeft, setSecondsLeft] = useState(() => {
    if (!session) return 0;
    const elapsed = Math.floor((Date.now() - session.startedAt) / 1000);
    return Math.max(0, (session.exam.minutes || 60) * 60 - elapsed);
  });

  useEffect(() => {
    if (submitted || secondsLeft <= 0) return;
    const t = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [secondsLeft, submitted]);

  // ── Anti-cheat: tab-switch / visibility / beforeunload ──────────────────────
  const violationsRef = useRef(0);
  const MAX_VIOLATIONS = 3;
  const [warnCount, setWarnCount] = useState(0);
  const [warnOpen, setWarnOpen] = useState(false);
  const submitRef = useRef<(() => Promise<void>) | null>(null);

  const handleViolation = useCallback(() => {
    if (submitted) return;
    violationsRef.current += 1;
    const v = violationsRef.current;
    setWarnCount(v);
    setWarnOpen(true);
    if (v >= MAX_VIOLATIONS) {
      // Auto-submit on 3rd violation
      submitRef.current?.();
    }
  }, [submitted]);

  useEffect(() => {
    // Relaxed exit guard: a plain reload resumes from saved progress (answers +
    // current question persist, timer runs from startedAt), so only genuine
    // tab-switching counts as a violation — no more reload block.
    // Tab switch / window minimise
    const onVisibilityChange = () => {
      if (document.hidden) handleViolation();
    };

    // Window blur (switch to another app)
    const onBlur = () => {
      if (document.hidden) return; // already handled above
      handleViolation();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
    };
  }, [handleViolation, submitted]);

  // ── Stable shuffled options ─────────────────────────────────────────────────
  // The server pre-shuffles options per question (answers never reach the
  // client). Legacy sessions still carry answers — shuffle those client-side.
  const optionsByQ = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const q of questions) {
      if (q.type === 'FILL_IN_THE_BLANK') {
        map[q.id] = [];
      } else if (q.options && q.options.length > 0) {
        map[q.id] = q.options;
      } else if (q.type === 'TRUE_FALSE') {
        map[q.id] = ['True', 'False'];
      } else {
        map[q.id] = shuffle([q.correct_answer ?? '', ...(q.incorrect_answers ?? [])]);
      }
    }
    return map;
  }, [questions]);

  const answered = (q: ExamQuestion) =>
    q.type === 'FILL_IN_THE_BLANK'
      ? (typed[q.id] ?? '').trim().length > 0
      : picked[q.id] !== undefined && picked[q.id] !== null;

  // ── Submit ──────────────────────────────────────────────────────────────────
  const submit = useCallback(async () => {
    if (!exam || busy || !userId || submitted) return;
    setBusy(true);
    setError(null);
    try {
      const questionAttempts = questions.map((q) => {
        if (q.type === 'FILL_IN_THE_BLANK') {
          const text = (typed[q.id] ?? '').trim();
          return { questionId: q.id, visited: true, attempted: text.length > 0, options: [], userOption: null, userTextAnswer: text };
        }
        const idx = picked[q.id] ?? null;
        return { questionId: q.id, visited: true, attempted: idx !== null, options: optionsByQ[q.id] ?? [], userOption: idx, userTextAnswer: null };
      });
      const res = await apiPost<{ overallScore: number; attempted_questions: number; total_questions: number }>('/results', {
        userId,
        examId: exam.id,
        attempted_questions: questionAttempts.filter((a) => a.attempted).length,
        total_questions: questions.length,
        questionAttempts,
      });
      setSubmitted(true);
      sessionStorage.removeItem(sessionKey);
      sessionStorage.removeItem(progressKey);
      // Store result for ExaminationPage to display on redirect
      sessionStorage.setItem(
        `exam_result_${code}`,
        JSON.stringify({ overallScore: res.data.overallScore, attempted: res.data.attempted_questions, total: res.data.total_questions }),
      );
      // Remove the beforeunload guard then navigate back to login/done page
      window.location.replace(ROUTES.examination.replace(':code', code));
    } catch (err: any) {
      setError(err?.message ?? 'Submit failed. Please try again.');
      setBusy(false);
    }
  }, [exam, busy, userId, submitted, picked, typed, optionsByQ, sessionKey, progressKey, code, questions]);

  // Keep submitRef in sync so the anti-cheat handler can call it
  useEffect(() => { submitRef.current = submit; }, [submit]);

  // Auto-submit when timer reaches zero
  useEffect(() => {
    if (secondsLeft === 0 && !submitted && exam && questions.length > 0) {
      submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const goTo = (idx: number) => {
    if (!exam) return;
    setCurrentQ(Math.max(0, Math.min(questions.length - 1, idx)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── Keyboard shortcuts: A… selects options, P previous, N next ─────────────
  // Ignored while typing, while dialogs are open, or after submit.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (submitted || calcOpen || warnOpen || confirmOpen) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      // Typing targets keep their keys; focused radios/checkboxes don't block shortcuts.
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName ?? '';
      const isTextEntry =
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        (t?.isContentEditable ?? false) ||
        (tag === 'INPUT' && ['TEXT', 'PASSWORD', 'EMAIL', 'SEARCH', 'NUMBER', 'TEL', 'URL'].includes((t as HTMLInputElement).type?.toUpperCase()));
      if (isTextEntry) return;
      const total = questions.length;
      if (!total) return;
      const q = questions[Math.min(currentQ, total - 1)];
      if (!q) return;
      const k = e.key.toLowerCase();
      if (k >= 'a' && k <= 'z') {
        const idx = k.charCodeAt(0) - 97;
        const opts = optionsByQ[q.id] ?? [];
        if (q.type !== 'FILL_IN_THE_BLANK' && idx < opts.length) {
          setPicked((p) => ({ ...p, [q.id]: idx }));
          e.preventDefault();
        }
        return;
      }
      if (k === 'p') {
        goTo(currentQ - 1);
        return;
      }
      if (k === 'n') {
        goTo(currentQ + 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [submitted, calcOpen, warnOpen, confirmOpen, questions, currentQ, optionsByQ, goTo]);

  // ── Guard: no session ───────────────────────────────────────────────────────
  if (!exam || !userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream font-sans text-ink">
        <p className="text-sm text-muted">Redirecting…</p>
      </div>
    );
  }

  const total = questions.length;
  // Clamp: resumed progress could exceed the list if the feed changed.
  const safeCurrent = total ? Math.min(currentQ, total - 1) : 0;
  const q = questions[safeCurrent];

  // ── Guard: filter chain assigned nothing (wrong class/combination, or an
  // exam whose subjects don't overlap the pupil's combination) ────────────────
  if (total === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-4 font-sans text-ink">
        <div className="w-full max-w-md border border-line bg-white p-8 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">No questions assigned</p>
          <h1 className="mt-3 font-display text-2xl font-extrabold">{exam.exam_name}</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Your class/combination has no questions in this exam. Check with your teacher —
            they may need to link your subjects to this exam.
          </p>
          <Link to={ROUTES.examination.replace(':code', code)} className="mt-6 inline-flex min-h-11 items-center rounded bg-brand-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
            Back
          </Link>
        </div>
      </div>
    );
  }
  const isFirst = safeCurrent === 0;
  const isLast = safeCurrent === total - 1;
  const answeredCount = questions.filter(answered).length;

  return (
    <>
      <PageMetadata
        title={exam.exam_name}
        description={`Sit ${exam.exam_name} online — answer and submit before time runs out.`}
      />

      {calcOpen && <CalculatorDialog onClose={() => setCalcOpen(false)} />}

      {warnOpen && violationsRef.current < MAX_VIOLATIONS && (
        <WarningOverlay
          count={warnCount}
          onDismiss={() => setWarnOpen(false)}
          onSubmitNow={() => { setWarnOpen(false); submit(); }}
        />
      )}

      {confirmOpen && (
        <SubmitConfirm
          total={total}
          answeredCount={answeredCount}
          busy={busy}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => { setConfirmOpen(false); submit(); }}
        />
      )}

      <div className="flex min-h-screen flex-col bg-cream font-sans text-ink">

        {/* ── Sticky header ── */}
        <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
          <div className="mx-auto flex min-h-[64px] w-full max-w-3xl items-center gap-3 px-4 sm:px-6">
            <Link to={ROUTES.home} className="shrink-0" aria-label="Home">
              <img src="/logo.png" alt={siteInfo.name} className="h-9 w-9 rounded-full object-cover" />
            </Link>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-extrabold">{exam.exam_name}</p>
              <p className="text-xs text-muted">Question {safeCurrent + 1} of {total}</p>
            </div>

            {/* Calculator */}
            <button
              type="button"
              onClick={() => setCalcOpen(true)}
              aria-label="Open calculator"
              title="Calculator"
              className="flex h-9 w-9 items-center justify-center rounded border border-line text-brand-800 transition-colors hover:bg-brand-50"
            >
              <Calculator size={16} aria-hidden="true" />
            </button>

            {/* Sitter avatar */}
            {sitter && (
              <span title={sitter.user_name} className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-900 text-xs font-extrabold text-lime-accent ring-1 ring-line">
                {sitter.student?.photoUrl || sitter.img ? (
                  <img src={(sitter.student?.photoUrl || sitter.img) as string} alt="" className="h-full w-full object-cover" />
                ) : (
                  sitter.user_name.split(' ').map((p) => p.replace('.', '')[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'LW'
                )}
              </span>
            )}

            {/* Timer */}
            <p
              className={`inline-flex items-center gap-1.5 rounded px-3 py-2 font-mono text-sm font-bold ${
                secondsLeft < 300 ? 'bg-rose-50 text-rose-700' : 'bg-brand-50 text-brand-700'
              }`}
              role="timer"
              aria-label="Time remaining"
            >
              <Clock size={14} aria-hidden="true" /> {fmtTime(secondsLeft)}
            </p>
          </div>
        </header>

        <main className="flex-1 py-8 sm:py-10">
          <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">

            {/* ── Dot-nav progress bar ── */}
            <nav aria-label="Question navigation" className="mb-6 flex flex-wrap items-center gap-1.5">
              {questions.map((x, i) => {
                const done = answered(x);
                const active = i === safeCurrent;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Go to question ${i + 1}${done ? ' (answered)' : ''}`}
                    aria-current={active ? 'step' : undefined}
                    className={[
                      'flex h-8 min-w-[2rem] items-center justify-center rounded px-2 text-xs font-bold transition-all duration-150',
                      active ? 'bg-brand-900 text-white shadow'
                        : done ? 'bg-brand-500 text-white'
                        : 'border border-line bg-white text-muted hover:border-brand-500 hover:text-brand-700',
                    ].join(' ')}
                  >
                    {i + 1}
                  </button>
                );
              })}
              <span className="ml-auto text-xs text-muted">
                {questions.filter(answered).length}/{total} answered
              </span>
            </nav>

            {/* ── Question card ── */}
            <article className="border border-line bg-white p-5 sm:p-8" aria-label={`Question ${safeCurrent + 1}`}>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-700">
                Question {safeCurrent + 1} of {total} · {q.type.replace(/_/g, ' ')}{q.subject?.name ? ` · ${q.subject.name}` : ''}
              </p>
              <div className="mt-3 font-display text-base font-extrabold leading-relaxed sm:text-lg">
                <Suspense fallback={<div className="h-6 animate-pulse rounded bg-brand-50" />}>
                  <NewsContent markdown={q.question} />
                </Suspense>
              </div>

              {q.type === 'FILL_IN_THE_BLANK' ? (
                <input
                  value={typed[q.id] ?? ''}
                  onChange={(e) => setTyped({ ...typed, [q.id]: e.target.value })}
                  placeholder="Type your answer…"
                  aria-label={`Answer for question ${safeCurrent + 1}`}
                  className="mt-5 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              ) : (
                <div className="mt-5 space-y-2.5" role="radiogroup" aria-label={`Options for question ${safeCurrent + 1}`}>
                  {(optionsByQ[q.id] ?? []).map((opt, oi) => (
                    <label
                      key={oi}
                      className={`flex cursor-pointer items-center gap-3 rounded border px-4 py-3.5 text-sm transition-colors ${
                        picked[q.id] === oi
                          ? 'border-brand-500 bg-brand-50 font-bold text-brand-800'
                          : 'border-line hover:border-brand-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${q.id}`}
                        checked={picked[q.id] === oi}
                        onChange={() => setPicked({ ...picked, [q.id]: oi })}
                        className="h-4 w-4 accent-brand-700"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              )}
            </article>

            {/* ── Prev / Next ── */}
            <div className="mt-5 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => goTo(safeCurrent - 1)}
                disabled={isFirst}
                title="Previous (P)"
                className="inline-flex min-h-11 items-center gap-2 rounded border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-brand-500 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} aria-hidden="true" /> Previous
              </button>

              {isLast ? (
                <button
                  type="button"
                  onClick={() => setConfirmOpen(true)}
                  disabled={busy}
                  title="Review and submit"
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  <Send size={15} aria-hidden="true" />
                  {busy ? 'Submitting…' : 'Submit answers'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => goTo(safeCurrent + 1)}
                  title="Next (N)"
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded bg-brand-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
                >
                  Next <ChevronRight size={16} aria-hidden="true" />
                </button>
              )}
            </div>

            {/* Secondary early-submit on any question */}
            {!isLast && (
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                disabled={busy}
                className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded border border-line bg-white px-5 py-2 text-sm font-semibold text-muted hover:border-brand-500 hover:text-brand-700 disabled:opacity-60"
              >
                <Send size={14} aria-hidden="true" />
                {busy ? 'Submitting…' : 'Submit now (finish early)'}
              </button>
            )}

            {/* Keyboard hints */}
            <p className="mt-3 text-center text-xs text-muted">
              Shortcuts: <Kbd>A</Kbd>–<Kbd>{String.fromCharCode(64 + Math.min((optionsByQ[q.id] ?? []).length, 26))}</Kbd> answer
              {' · '}<Kbd>P</Kbd> previous {' · '}<Kbd>N</Kbd> next
            </p>

            {error && (
              <p role="alert" className="mt-4 border-l-2 border-rose-400 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {error}
              </p>
            )}

          </div>
        </main>
      </div>
    </>
  );
};
