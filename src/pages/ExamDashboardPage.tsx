import { Link, useNavigate } from 'react-router-dom';
import { PageMetadata } from '@/components/ui/PageMetadata';
import { useAuth, useResource } from '@/context/AuthContext';
import { ROUTES } from '@/routes/paths';
import { siteInfo } from '@/data/content';
import { BookOpen, CheckCircle2, Clock, Loader2, Lock, LogOut, User } from 'lucide-react';

interface ExamRow {
  id: string;
  code: string;
  status: string;
  startsAt?: string | null;
  /** Already sat it — staff must re-open before the pupil can sit it again. */
  locked: boolean;
  exam: {
    id: string;
    exam_name: string;
    minutes: number;
    class?: { id: string; name: string } | null;
    _count?: { questions: number };
  } | null;
  result?: { submitted: boolean; date: string } | null;
}

const initialsOf = (name: string) =>
  name
    .split(' ')
    .map((p) => p.replace('.', '')[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'LW';

/**
 * Pupil exam portal — the hall noticeboard. Lists every LIVE online exam the
 * signed-in pupil is allowed to sit (class + combination gated server-side),
 * then hands off to the join-code screen for that deployment.
 */
export const ExamDashboardPage = () => {
  const { user, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const exams = useResource<ExamRow[]>(user ? '/exam-deployments/mine' : null);

  const rows = (exams.data ?? []).filter((r) => !!r.exam);
  const staff = !!user && ['TEACHER', 'ADMIN', 'OWNER', 'MEMBER'].includes(user.role);

  const doLogout = async () => {
    await logout();
    navigate(ROUTES.login);
  };

  return (
    <div className="flex min-h-screen flex-col bg-cream font-sans text-ink">
      <PageMetadata
        title="Examination portal"
        description="See the examinations available to you and start a sitting."
      />

      {/* ── Header ── */}
      <header className="z-10 border-b border-brand-800 bg-brand-900 px-4 py-4 shadow-md sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
          <Link to={ROUTES.home} className="flex min-w-0 items-center gap-3">
            <img
              src="/logo.png"
              alt=""
              className="h-10 w-10 shrink-0 rounded-full border border-white/20 object-cover sm:h-11 sm:w-11"
            />
            <span className="truncate text-lg font-medium tracking-tight text-white">{siteInfo.name}</span>
          </Link>

          {user ? (
            <div className="flex shrink-0 items-center gap-4">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-white">{user.user_name}</p>
                <p className="max-w-[180px] truncate text-xs text-white/70">{user.user_email || 'Student account'}</p>
              </div>
              <button
                type="button"
                onClick={doLogout}
                className="flex items-center gap-2 rounded border border-brand-700 bg-brand-800 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-rose-900/90 hover:text-rose-200"
              >
                <LogOut size={16} aria-hidden="true" /> Logout
              </button>
            </div>
          ) : (
            <Link
              to={ROUTES.login}
              className="rounded bg-lime-accent px-4 py-2 text-xs font-bold text-brand-900 hover:bg-white"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6 md:p-10">
        {/* ── Welcome card ── */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-line bg-white p-6 shadow-sm sm:p-8">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-900 text-xl font-medium text-lime-accent shadow-sm">
              {user ? initialsOf(user.user_name) : <User size={24} aria-hidden="true" />}
            </div>
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-widest text-brand-700">
                {user ? 'Welcome back' : 'Examination portal'}
              </p>
              <h1 className="font-display text-2xl font-medium tracking-tight text-ink">
                {user?.user_name || 'Student'}
              </h1>
              <p className="mt-1 text-sm text-muted">
                {user
                  ? 'Select an examination below to begin your hall session.'
                  : 'Sign in to see the examinations assigned to your class.'}
              </p>
            </div>
          </div>

          {user && (
            <div className="hidden flex-col items-end gap-1 text-right md:flex">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
                Portal connected
              </span>
              {user.student && (
                <span className="text-xs text-muted">
                  {user.student.className} · {user.student.studentCode}
                </span>
              )}
            </div>
          )}
        </div>

        {/* ── Signed out ── */}
        {!user && !authLoading && (
          <div className="rounded-lg border border-line bg-white p-8 text-center sm:p-12">
            <p className="text-sm font-semibold text-muted">
              You are not signed in. Sign in to load your examination list, or enter a join code from your teacher.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to={ROUTES.login}
                className="inline-flex min-h-11 items-center rounded bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
              >
                Sign in
              </Link>
              <Link
                to={ROUTES.home}
                className="inline-flex min-h-11 items-center rounded border border-line bg-white px-5 py-2.5 text-sm font-bold text-brand-800 hover:border-brand-500 hover:text-brand-700"
              >
                Back to website
              </Link>
            </div>
          </div>
        )}

        {/* ── Staff ── */}
        {staff && (
          <div className="rounded-lg border border-line bg-white p-6 sm:p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-700">Staff account</p>
            <h2 className="mt-2 font-display text-xl font-extrabold">Exam dashboard is for pupils</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Deployments, join codes and offline packs live in the admin workspace.
            </p>
            <Link
              to={ROUTES.adminDeployments}
              className="mt-5 inline-flex min-h-11 items-center rounded bg-brand-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
            >
              Open deployments
            </Link>
          </div>
        )}

        {/* ── Available exams ── */}
        {user && !staff && (
          <>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="rounded border border-brand-200 bg-brand-50 p-2 text-brand-700">
                  <BookOpen size={20} aria-hidden="true" />
                </div>
                <h2 className="text-lg font-medium text-ink">Available Examinations</h2>
              </div>
              <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
                {rows.length} {rows.length === 1 ? 'Exam' : 'Exams'}
              </span>
            </div>

            {exams.loading || authLoading ? (
              <div className="flex items-center justify-center gap-3 rounded-lg border border-line bg-white p-12 text-muted">
                <Loader2 className="animate-spin text-brand-500" size={20} aria-hidden="true" />
                <span className="text-xs font-semibold uppercase tracking-widest text-brand-700">Loading exams…</span>
              </div>
            ) : exams.error ? (
              <div role="alert" className="rounded-r border-l-2 border-rose-400 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                Couldn't load your examinations — {exams.error}
                <button
                  type="button"
                  onClick={exams.reload}
                  className="ml-2 font-bold underline underline-offset-2 hover:text-rose-900"
                >
                  Retry
                </button>
              </div>
            ) : rows.length === 0 ? (
              <div className="rounded-lg border border-line bg-white p-12 text-center">
                <p className="text-sm font-semibold text-muted">
                  No exams are live for your class right now. Check back when your teacher starts one.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {rows.map((row) => {
                  const exam = row.exam!;
                  const questionCount = exam._count?.questions ?? 0;
                  return (
                    <div
                      key={row.id}
                      className="group flex flex-col justify-between rounded-lg border border-line bg-white p-6 shadow-sm transition-all duration-200 hover:border-brand-500 hover:ring-1 hover:ring-brand-500"
                    >
                      <div>
                        <div className="mb-3 flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="text-base font-medium text-ink transition-colors group-hover:text-brand-700">
                              {exam.exam_name}
                            </h3>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-muted">
                              {exam.class?.name || 'General'}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700">
                            {questionCount} Qs
                          </span>
                        </div>

                        <div className="mt-4 flex items-center gap-2 text-sm text-muted">
                          <Clock size={16} aria-hidden="true" className="text-brand-700" />
                          <span>{exam.minutes || 60} minutes</span>
                        </div>

                        {row.locked && (
                          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-800">
                            <Lock size={12} aria-hidden="true" /> Already submitted
                          </p>
                        )}
                      </div>

                      {row.locked ? (
                        <p className="mt-6 flex items-center justify-center gap-2 rounded-md border border-line bg-cream py-3 text-sm font-semibold text-muted">
                          <CheckCircle2 size={16} aria-hidden="true" className="text-emerald-700" />
                          Awaiting result release
                        </p>
                      ) : (
                        <Link
                          to={ROUTES.examination.replace(':code', row.code)}
                          className="mt-6 flex items-center justify-center gap-2 rounded-md bg-brand-500 py-3 font-medium text-white shadow-sm transition-all duration-150 hover:bg-brand-700"
                        >
                          Start Examination
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <p className="mt-6 text-xs text-muted">
              Have a join code instead?{' '}
              {rows[0] ? (
                <Link to={ROUTES.examination.replace(':code', rows[0].code)} className="font-bold text-brand-700 hover:underline">
                  Open an exam by code
                </Link>
              ) : (
                <span className="font-bold text-brand-700">Ask your teacher for the code.</span>
              )}
            </p>
          </>
        )}
      </main>

      <footer className="mt-auto border-t border-line p-6 text-center text-xs font-medium text-muted">
        © {new Date().getFullYear()} {siteInfo.name}. All rights reserved.
      </footer>
    </div>
  );
};
