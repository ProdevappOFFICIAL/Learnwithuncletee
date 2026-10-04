import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Container } from '@/components/ui/Container';
import { PageMetadata } from '@/components/ui/PageMetadata';
import { useAuth } from '@/context/AuthContext';
import { apiGetPublic, apiPost } from '@/lib/api';
import { ROUTES } from '@/routes/paths';
import { CheckCircle2, ChevronLeft, Clock, Send } from 'lucide-react';

const NewsContent = lazy(() => import('@/lib/mdxEditor').then((m) => ({ default: m.NewsContent })));

interface ExamQuestion {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_IN_THE_BLANK';
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
}

interface LiveExam {
  code: string;
  exam: {
    id: string;
    exam_name: string;
    minutes: number;
    questions: ExamQuestion[];
  };
}

type Phase = 'loading' | 'unavailable' | 'login' | 'exam' | 'done';

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

export const ExaminationPage = () => {
  const { code = '' } = useParams<{ code: string }>();
  const { login } = useAuth();
  const [phase, setPhase] = useState<Phase>('loading');
  const [exam, setExam] = useState<LiveExam['exam'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // login form
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [userId, setUserId] = useState<string | null>(null);

  // answers keyed by question id
  const [picked, setPicked] = useState<Record<string, number | null>>({});
  const [typed, setTyped] = useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [result, setResult] = useState<{ overallScore: number; attempted: number; total: number } | null>(null);

  // stable shuffled options per question
  const optionsByQ = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const q of exam?.questions ?? []) {
      if (q.type === 'TRUE_FALSE') map[q.id] = ['True', 'False'];
      else map[q.id] = shuffle([q.correct_answer, ...(q.incorrect_answers ?? [])]);
    }
    return map;
  }, [exam]);

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    setError(null);
    apiGetPublic<LiveExam>(`/exam-deployments/by-code/${code}`)
      .then((res) => {
        if (cancelled) return;
        setExam(res.data.exam);
        setSecondsLeft((res.data.exam.minutes || 60) * 60);
        setPhase('login');
      })
      .catch((e: any) => {
        if (!cancelled) {
          setError(e?.status === 404 ? 'This examination is not available. Check the code with your teacher.' : (e?.message ?? 'Could not load examination'));
          setPhase('unavailable');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  useEffect(() => {
    if (phase !== 'exam' || secondsLeft <= 0) return;
    const t = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [phase, secondsLeft]);

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const me = await login(identity.trim(), password);
      setUserId(me.id);
      setPhase('exam');
    } catch (err: any) {
      setError(err?.message ?? 'Sign-in failed. Use your email or admission no.');
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!exam || busy || !userId) return;
    setBusy(true);
    setError(null);
    try {
      const questionAttempts = exam.questions.map((q) => {
        if (q.type === 'FILL_IN_THE_BLANK') {
          const text = (typed[q.id] ?? '').trim();
          return { questionId: q.id, visited: true, attempted: text.length > 0, options: [], userOption: null, userTextAnswer: text };
        }
        const idx = picked[q.id] ?? null;
        return { questionId: q.id, visited: true, attempted: idx !== null, options: optionsByQ[q.id] ?? [], userOption: idx, userTextAnswer: null };
      });
      // userId is resolved server-side from the session token.
      const res = await apiPost<{ overallScore: number; attempted_questions: number; total_questions: number }>('/results', {
        userId,
        examId: exam.id,
        attempted_questions: questionAttempts.filter((a) => a.attempted).length,
        total_questions: exam.questions.length,
        questionAttempts,
      });
      setResult({ overallScore: res.data.overallScore, attempted: res.data.attempted_questions, total: res.data.total_questions });
      setPhase('done');
      window.scrollTo({ top: 0 });
    } catch (err: any) {
      setError(err?.message ?? 'Submit failed. Try again.');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (phase === 'exam' && secondsLeft === 0 && exam && exam.questions.length > 0 && !result) {
      submit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft]);

  const inputClass = 'mt-2 min-h-12 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500';

  return (
    <>
      <PageMetadata
        title={exam ? exam.exam_name : 'Examination'}
        description={exam ? `Sit ${exam.exam_name} online — answer and submit before time runs out.` : 'Online examination.'}
      />
      <div className="flex min-h-screen flex-col bg-cream font-sans text-ink">
        <header className="border-b border-line bg-brand-900 text-white">
          <div className="mx-auto flex min-h-[60px] w-full max-w-3xl items-center gap-3 px-4 sm:px-6">
            <img src="/logo.png" alt="Learnwithuncletee" className="h-9 w-9 rounded-full border border-white/20 object-cover" />
            <span className="font-display text-sm font-extrabold leading-tight">
              Learnwithuncletee
              <span className="block text-[10px] font-semibold uppercase tracking-widest text-lime-accent">Online examination</span>
            </span>
            <span className="ml-auto rounded bg-white/10 px-3 py-1.5 font-mono text-xs font-bold tracking-widest">
              {code.toUpperCase()}
            </span>
          </div>
        </header>
        <main className="flex-1">
          <section className="py-10 sm:py-14">
            <Container>
              <div className="mx-auto max-w-3xl">

            {phase === 'loading' && (
              <div className="space-y-3" aria-label="Loading">
                {[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded bg-white" />)}
              </div>
            )}

            {phase === 'unavailable' && (
              <div className="border border-line bg-white p-8 text-center">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Unavailable</p>
                <h1 className="mt-3 font-display text-2xl font-extrabold">Examination not found</h1>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted">{error ?? 'Check the code with your teacher.'}</p>
                <Link to={ROUTES.home} className="mt-6 inline-flex min-h-11 items-center rounded bg-brand-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
                  <ChevronLeft aria-hidden="true" size={16} className="mr-1" /> Back home
                </Link>
              </div>
            )}

            {phase === 'login' && exam && (
              <div className="border border-line bg-white p-6 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Online examination · Code {code.toUpperCase()}</p>
                <h1 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">{exam.exam_name}</h1>
                <p className="mt-2 text-sm text-muted">{exam.questions.length} question(s) · {exam.minutes} minutes. Sign in with your email or admission no to begin.</p>
                <form onSubmit={doLogin} className="mt-6 space-y-4">
                  <label className="block text-sm font-semibold">Email or admission no
                    <input value={identity} onChange={(e) => setIdentity(e.target.value)} required placeholder="you@example.com or LWU/2024/0312" autoComplete="username" className={inputClass} />
                  </label>
                  <label className="block text-sm font-semibold">Password
                    <input value={password} onChange={(e) => setPassword(e.target.value)} required type="password" autoComplete="current-password" className={inputClass} />
                  </label>
                  {error && <p role="alert" className="border-l-2 border-rose-400 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}
                  <button type="submit" disabled={busy} className="min-h-12 w-full rounded bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60">
                    {busy ? 'Signing in…' : 'Start examination'}
                  </button>
                </form>
              </div>
            )}

            {phase === 'exam' && exam && (
              <div className="space-y-5">
                <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border border-line bg-white px-5 py-4">
                  <div>
                    <h1 className="font-display text-lg font-extrabold">{exam.exam_name}</h1>
                    <p className="text-xs text-muted">{exam.questions.length} questions</p>
                  </div>
                  <p className={`inline-flex items-center gap-2 rounded px-3 py-2 font-mono text-sm font-bold ${secondsLeft < 300 ? 'bg-rose-50 text-rose-700' : 'bg-brand-50 text-brand-700'}`} role="timer" aria-label="Time remaining">
                    <Clock size={15} aria-hidden="true" /> {fmtTime(secondsLeft)}
                  </p>
                </div>

                {exam.questions.map((q, i) => (
                  <article key={q.id} className="border border-line bg-white p-5 sm:p-6">
                    <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Question {i + 1} · {q.type.replace(/_/g, ' ')}</p>
                    <div className="mt-2 font-display text-base font-extrabold">
                      <Suspense fallback={<div className="h-6 animate-pulse rounded bg-brand-50" />}>
                        <NewsContent markdown={q.question} />
                      </Suspense>
                    </div>
                    {q.type === 'FILL_IN_THE_BLANK' ? (
                      <input
                        value={typed[q.id] ?? ''}
                        onChange={(e) => setTyped({ ...typed, [q.id]: e.target.value })}
                        placeholder="Type your answer…"
                        aria-label={`Answer for question ${i + 1}`}
                        className="mt-4 min-h-11 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500"
                      />
                    ) : (
                      <div className="mt-4 space-y-2" role="radiogroup" aria-label={`Options for question ${i + 1}`}>
                        {(optionsByQ[q.id] ?? []).map((opt, oi) => (
                          <label
                            key={oi}
                            className={`flex cursor-pointer items-center gap-3 rounded border px-4 py-3 text-sm transition-colors ${
                              picked[q.id] === oi ? 'border-brand-500 bg-brand-50 font-bold text-brand-800' : 'border-line hover:border-brand-500'
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
                ))}

                {error && <p role="alert" className="border-l-2 border-rose-400 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}
                <button
                  type="button"
                  onClick={submit}
                  disabled={busy}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  <Send aria-hidden="true" size={16} className="mr-2" /> {busy ? 'Submitting…' : 'Submit answers'}
                </button>
              </div>
            )}

            {phase === 'done' && result && (
              <div className="border border-line bg-white p-8 text-center sm:p-12">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                  <CheckCircle2 size={26} aria-hidden="true" />
                </span>
                <h1 className="mt-4 font-display text-2xl font-extrabold">Submitted</h1>
                <p className="mt-2 font-display text-5xl font-extrabold text-brand-700">{result.overallScore}%</p>
                <p className="mt-2 text-sm text-muted">You attempted {result.attempted} of {result.total} questions. Your teacher can see this in test Results.</p>
                <Link to={ROUTES.home} className="mt-6 inline-flex min-h-11 items-center rounded bg-brand-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700">
                  <ChevronLeft aria-hidden="true" size={16} className="mr-1" /> Back home
                </Link>
              </div>
            )}
          </div>
        </Container>
          </section>
        </main>
      </div>
    </>
  );
};
