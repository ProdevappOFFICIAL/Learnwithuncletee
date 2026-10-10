import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { PageMetadata } from '@/components/ui/PageMetadata';
import { useAuth } from '@/context/AuthContext';
import { apiGet, apiGetPublic } from '@/lib/api';
import { ROUTES } from '@/routes/paths';
import { siteInfo } from '@/data/content';
import { CheckCircle2, ChevronLeft } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

/** One sitting question: options are pre-shuffled server-side, answers never sent. */
export interface ExamQuestion {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_IN_THE_BLANK';
  question: string;
  subjectId?: string;
  subject?: { id: string; name: string } | null;
  options?: string[];
  /** Attachment: online UploadThing URL or offline plain path (resolved later). */
  question_file?: string | null;
  // Legacy sessions (stored before answer-stripping) may still carry these.
  correct_answer?: string;
  incorrect_answers?: string[];
}

export interface LiveExam {
  code: string;
  exam: {
    id: string;
    exam_name: string;
    minutes: number;
    class?: { id: string; name: string } | null;
    _count?: { questions: number };
  };
}

interface QuestionFeed {
  exam: { id: string; exam_name: string; minutes: number };
  questions: ExamQuestion[];
  subjects: Array<{ id: string; name: string }>;
  gate: { className: string; combinationName: string | null } | null;
}

type Phase = 'loading' | 'unavailable' | 'login' | 'done';

// Matches LoginPage's input style exactly
const inputClass =
  'mt-2 min-h-12 w-full rounded border border-line bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100';

// ─── ExaminationPage — login + pre/post-exam shell ────────────────────────────

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

  // result shown after redirect-back from exam room (via sessionStorage)
  const [result] = useState<{ attempted: number; total: number } | null>(() => {
    try {
      const raw = sessionStorage.getItem(`exam_result_${code}`);
      if (raw) { sessionStorage.removeItem(`exam_result_${code}`); return JSON.parse(raw); }
    } catch { /* ignore */ }
    return null;
  });

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    setError(null);
    apiGetPublic<LiveExam>(`/exam-deployments/by-code/${code}`)
      .then((res) => {
        if (cancelled) return;
        setExam(res.data.exam);
        setPhase(result ? 'done' : 'login');
      })
      .catch((e: any) => {
        if (!cancelled) {
          setError(
            e?.status === 404
              ? 'This examination is not available. Check the code with your teacher.'
              : (e?.message ?? 'Could not load examination'),
          );
          setPhase('unavailable');
        }
      });
    return () => { cancelled = true; };
  }, [code]);

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const me = await login(identity.trim(), password);
      if (!exam) return;
      // Submission lock: a locked online row means this pupil already
      // participated — block re-entry until the admin flips the switch off.
      const lockCheck = await apiGet<Array<{ submitted?: boolean }>>('/results', {
        userId: me.id,
        examId: exam.id,
        limit: 1,
      });
      if ((lockCheck.data ?? []).some((r) => r.submitted === true)) {
        setError(
          `You have already participated in ${exam.exam_name} — you can't log in again until the admin re-opens it. Contact your teacher.`,
        );
        return;
      }
      // Post-login: pull this pupil's filtered question feed (class → exam →
      // combination → subject). 403 here means the exam isn't for their class.
      const feed = await apiGet<QuestionFeed>(`/exam-deployments/by-code/${code}/questions`);
      if (feed.data.questions.length === 0) {
        setError(
          `Signed in as ${me.user_name}, but no questions are assigned to you in ${feed.data.exam.exam_name}` +
          (feed.data.gate?.combinationName ? ` for combination ${feed.data.gate.combinationName}` : '') +
          '. Check with your teacher.',
        );
        return;
      }
      // Store exam payload + userId in sessionStorage so ExamRoomPage can pick it up
      sessionStorage.setItem(
        `exam_session_${code}`,
        JSON.stringify({ exam: feed.data.exam, questions: feed.data.questions, subjects: feed.data.subjects, gate: feed.data.gate, userId: me.id, startedAt: Date.now() }),
      );
      // Hard navigate so ExamRoomPage mounts fresh (prevents back-button to login mid-exam)
      window.location.href = ROUTES.examinationRoom.replace(':code', code);
    } catch (err: any) {
      setError(err?.message ?? 'Sign-in failed. Use your email or admission no.');
    } finally {
      setBusy(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <PageMetadata
        title={exam ? exam.exam_name : 'Examination'}
        description={
          exam
            ? `Sit ${exam.exam_name} online — answer and submit before time runs out.`
            : 'Online examination.'
        }
      />

      <main className="grid min-h-screen lg:grid-cols-[1.05fr_.95fr]">

        {/* ── Left hero panel ── */}
        <section
          className="relative isolate flex min-h-[340px] items-end overflow-hidden bg-brand-900 p-7 text-white sm:p-12 lg:min-h-screen lg:p-16"
          style={{
            backgroundImage:
              'linear-gradient(0deg,rgba(4,46,26,.92),rgba(4,58,33,.25)),url(/school.JPG)',
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
        >
          <div className="relative max-w-xl">
            <Link to={ROUTES.home} className="mb-10 inline-flex items-center gap-3">
              <img src="/logo.png" alt="" className="h-12 w-12 rounded-full object-cover" />
              <span className="font-extrabold">{siteInfo.name}</span>
            </Link>
            <p className="text-xs font-bold uppercase tracking-[.18em] text-lime-accent">
              Online examination
            </p>
            <h1 className="mt-4 text-4xl font-extrabold sm:text-5xl">
              {exam ? exam.exam_name : 'Online Examination'}
            </h1>
            <p className="mt-4 max-w-lg leading-relaxed text-white/80">
              {exam
                ? `${exam._count?.questions ?? 0} question${(exam._count?.questions ?? 0) !== 1 ? 's' : ''} · ${exam.minutes} minutes. Sign in with your school credentials to begin.`
                : 'Enter your examination code to access your assigned test.'}
            </p>
            {exam && phase !== 'done' && (
              <p className="mt-5 inline-flex items-center gap-2 rounded bg-white/10 px-4 py-2 font-mono text-sm font-bold tracking-widest text-lime-accent">
                CODE: {code.toUpperCase()}
              </p>
            )}
          </div>
        </section>

        {/* ── Right form panel ── */}
        <section className="flex items-center justify-center px-5 py-12 sm:px-10">
          <div className="w-full max-w-md">

            <Link
              to={ROUTES.home}
              className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-500"
            >
              <ChevronLeft aria-hidden="true" size={16} />
              Back to website
            </Link>

            <div className="mt-10 w-full max-w-md rounded border border-line bg-cream px-4 pb-10">

              {/* Loading skeleton */}
              {phase === 'loading' && (
                <>
                  <p className="mt-6 text-xs font-bold uppercase tracking-widest text-brand-700">Please wait</p>
                  <h2 className="mt-3 text-3xl font-extrabold">Loading examination…</h2>
                  <div className="mt-8 animate-pulse space-y-5" aria-label="Loading">
                    <div className="h-12 rounded bg-brand-50" />
                    <div className="h-12 rounded bg-brand-50" />
                    <div className="h-12 rounded bg-brand-500/40" />
                  </div>
                </>
              )}

              {/* Unavailable */}
              {phase === 'unavailable' && (
                <>
                  <p className="mt-6 text-xs font-bold uppercase tracking-widest text-brand-700">Unavailable</p>
                  <h2 className="mt-3 text-3xl font-extrabold">Examination not found</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {error ?? 'Check the code with your teacher.'}
                  </p>
                  <Link
                    to={ROUTES.home}
                    className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded bg-brand-900 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700"
                  >
                    <ChevronLeft aria-hidden="true" size={16} className="mr-1" /> Back home
                  </Link>
                </>
              )}

              {/* Login */}
              {phase === 'login' && exam && (
                <>
                  <p className="mt-6 text-xs font-bold uppercase tracking-widest text-brand-700">Secure access</p>
                  <h2 className="mt-3 text-3xl font-extrabold">Sign in to begin</h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    Sign in with the credentials provided by your school.
                  </p>

                  <form onSubmit={doLogin} className="mt-8 space-y-5">
                    <label className="block text-sm font-semibold">
                      Email address / Admission No
                      <input
                        value={identity}
                        onChange={(e) => setIdentity(e.target.value)}
                        required
                        placeholder="you@example.com or XXXX/2024/0312"
                        autoComplete="username"
                        className={inputClass}
                      />
                    </label>
                    <label className="block text-sm font-semibold">
                      Password
                      <input
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        type="password"
                        autoComplete="current-password"
                        className={inputClass}
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={busy}
                      className="min-h-12 w-full rounded bg-brand-500 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
                    >
                      {busy ? 'Signing in…' : 'Start examination'}
                    </button>
                  </form>

                  {error && (
                    <p role="alert" className="mt-4 border-l-2 border-rose-400 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                      {error}
                    </p>
                  )}
                </>
              )}

              {/* Done — confirmation only. Scores stay hidden until the school releases them. */}
              {phase === 'done' && result && (
                <div className="mt-8 text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                    <CheckCircle2 size={26} aria-hidden="true" />
                  </span>
                  <p className="mt-6 text-xs font-bold uppercase tracking-widest text-brand-700">Examination complete</p>
                  <h2 className="mt-3 text-3xl font-extrabold">Submitted!</h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    You attempted {result.attempted} of {result.total} questions. Your score is hidden — the school will release results.
                  </p>
                  <Link
                    to={ROUTES.home}
                    className="mt-8 inline-flex min-h-12 w-full items-center justify-center rounded bg-brand-900 px-5 py-3 text-sm font-bold text-white hover:bg-brand-700"
                  >
                    <ChevronLeft aria-hidden="true" size={16} className="mr-1" /> Back home
                  </Link>
                </div>
              )}

            </div>
          </div>
        </section>
      </main>
    </>
  );
};
