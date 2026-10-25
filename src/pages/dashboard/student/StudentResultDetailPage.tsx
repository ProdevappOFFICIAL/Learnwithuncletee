import { Suspense, lazy, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, CircleSlash, Minus, Paperclip, X } from 'lucide-react';
import {
  Card,
  CardHead,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  Pill,
  StatTile,
} from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { ROUTES } from '@/routes/paths';

/** Rich renderer shared with the news pages + exam room, so a question reads
 * exactly as the pupil saw it when they sat the paper. */
const QuestionContent = lazy(() => import('@/lib/mdxEditor').then((m) => ({ default: m.NewsContent })));

type QuestionType = 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'FILL_IN_THE_BLANK';

interface QuestionAttemptDetail {
  id: string;
  visited: boolean;
  attempted: boolean;
  options: string[];
  userOption: number | null;
  userTextAnswer: string | null;
  /** Marked server-side with the same scoring core that produced the result. */
  correct: boolean;
  subjectName?: string;
  question: {
    id: string;
    type: QuestionType;
    question: string;
    correct_answer: string;
    incorrect_answers: string[] | null;
    explanation?: string | null;
    question_file?: string | null;
    subjectId: string;
  };
}

interface ResultDetail {
  id: string;
  overallScore: number;
  attempted_questions: number;
  total_questions: number;
  date: string;
  submitted?: boolean;
  subjectNames?: Record<string, string>;
  user?: { user_name: string; class?: { name: string } | null };
  exam?: { exam_name: string; minutes?: number };
  questionAttempts?: QuestionAttemptDetail[];
}

type Verdict = 'correct' | 'wrong' | 'skipped';

const verdictOf = (a: QuestionAttemptDetail): Verdict =>
  !a.attempted ? 'skipped' : a.correct ? 'correct' : 'wrong';

const VERDICT_META: Record<Verdict, { label: string; tone: 'emerald' | 'rose' | 'amber' }> = {
  correct: { label: 'Correct', tone: 'emerald' },
  wrong: { label: 'Wrong', tone: 'rose' },
  skipped: { label: 'Not answered', tone: 'amber' },
};

const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();

/**
 * Options as the pupil saw them. Older desktop syncs stored no option list, so
 * fall back to the canonical [correct, ...incorrect] order — the same order the
 * scorer uses when resolving the picked index.
 */
const optionsOf = (a: QuestionAttemptDetail): string[] =>
  a.options.length > 0
    ? a.options
    : [a.question.correct_answer, ...(a.question.incorrect_answers ?? [])].filter(
        (o) => o !== null && o !== undefined,
      );

const pct = (n: number) => `${Math.round(n * 10) / 10}%`;

const isImageUrl = (url: string) => /\.(png|jpe?g|gif|webp|avif|bmp|svg)(\?|#|$)/i.test(url);

/** One question attempt, rendered as an answer sheet line. */
const AttemptCard = ({ attempt, index }: { attempt: QuestionAttemptDetail; index: number }) => {
  const verdict = verdictOf(attempt);
  const meta = VERDICT_META[verdict];
  const opts = optionsOf(attempt);
  const isFill = attempt.question.type === 'FILL_IN_THE_BLANK';
  const correctText = attempt.question.correct_answer;
  const answered = attempt.attempted;

  return (
    <li className="border border-line bg-white">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-brand-50/40 px-4 py-2.5">
        <p className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-brand-700">
          <span>Question {index + 1}</span>
          <span className="text-muted">·</span>
          <span className="text-muted">{attempt.question.type.replace(/_/g, ' ')}</span>
          {attempt.subjectName && (
            <>
              <span className="text-muted">·</span>
              <span className="text-muted">{attempt.subjectName}</span>
            </>
          )}
        </p>
        <span className="flex items-center gap-1.5">
          {!attempt.visited && <Pill tone="amber">Not visited</Pill>}
          <Pill tone={meta.tone}>{meta.label}</Pill>
        </span>
      </div>

      <div className="space-y-3 px-4 py-4">
        <div className="text-sm font-semibold leading-relaxed text-ink">
          <Suspense
            fallback={
              <p className="whitespace-pre-wrap break-words">{attempt.question.question}</p>
            }
          >
            <QuestionContent markdown={attempt.question.question} />
          </Suspense>
        </div>

        {attempt.question.question_file?.trim() && (
          <a
            href={attempt.question.question_file.trim()}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded border border-line px-3 py-1.5 text-xs font-bold text-brand-700 hover:border-brand-500 hover:bg-brand-50"
          >
            <Paperclip size={13} aria-hidden="true" />
            {isImageUrl(attempt.question.question_file) ? 'View question image' : 'Open question file'}
          </a>
        )}

        {isFill ? (
          <div className="grid gap-2 sm:grid-cols-2">
            <div
              className={`rounded border px-3 py-2.5 ${
                !answered
                  ? 'border-line bg-cream'
                  : attempt.correct
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-rose-200 bg-rose-50'
              }`}
            >
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted">Your answer</p>
              <p className="mt-1 break-words text-sm font-bold text-ink">
                {attempt.userTextAnswer?.trim() ? attempt.userTextAnswer : '— left blank —'}
              </p>
            </div>
            <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2.5">
              <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-800">Correct answer</p>
              <p className="mt-1 break-words text-sm font-bold text-emerald-900">{correctText}</p>
            </div>
          </div>
        ) : (
          <ul className="grid gap-2">
            {opts.map((opt, i) => {
              const mine = attempt.userOption === i;
              const isCorrect = norm(opt) === norm(correctText);
              return (
                <li
                  key={i}
                  className={`flex items-start justify-between gap-3 rounded border px-3 py-2.5 text-sm ${
                    isCorrect
                      ? 'border-emerald-300 bg-emerald-50'
                      : mine
                        ? 'border-rose-300 bg-rose-50'
                        : 'border-line bg-white'
                  }`}
                >
                  <span className="flex min-w-0 items-start gap-2.5">
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${
                        isCorrect ? 'bg-emerald-600 text-white' : mine ? 'bg-rose-600 text-white' : 'bg-brand-50 text-brand-700'
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className={`break-words ${isCorrect ? 'font-bold text-emerald-900' : mine ? 'font-bold text-rose-900' : 'text-ink'}`}>
                      {opt}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-wider">
                    {mine && (
                      <span className={`inline-flex items-center gap-1 ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {isCorrect ? <Check size={12} aria-hidden="true" /> : <X size={12} aria-hidden="true" />}
                        Your answer
                      </span>
                    )}
                    {isCorrect && !mine && (
                      <span className="inline-flex items-center gap-1 text-emerald-700">
                        <Check size={12} aria-hidden="true" /> Correct
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
            {opts.length === 0 && (
              <li className="rounded border border-dashed border-line bg-cream px-3 py-2.5 text-xs text-muted">
                No options were stored for this question.
              </li>
            )}
          </ul>
        )}

        {!answered && (
          <p className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
            <Minus size={13} aria-hidden="true" />
            {attempt.visited ? 'Visited but not answered — scored zero.' : 'Not visited — scored zero.'}
          </p>
        )}

        {attempt.question.explanation?.trim() && (
          <div className="border-l-2 border-brand-400 bg-cream px-3 py-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-700">Explanation</p>
            <div className="mt-1 text-xs leading-relaxed text-ink">
              <Suspense
                fallback={<p className="whitespace-pre-wrap break-words">{attempt.question.explanation}</p>}
              >
                <QuestionContent markdown={attempt.question.explanation} />
              </Suspense>
            </div>
          </div>
        )}
      </div>
    </li>
  );
};

/**
 * Full review of one sitting: every question, whether it was visited/answered,
 * the pupil's answer and the correct one. Reached from "Full result" on the
 * results page — reads the same `/results/:id` / `/offline-results/:id` rows
 * the score was computed from.
 */
export const StudentResultDetailPage = () => {
  const { origin = 'online', id = '' } = useParams<{ origin: string; id: string }>();
  const offline = origin.toLowerCase() === 'offline';
  const res = useResource<ResultDetail>(id ? `${offline ? '/offline-results' : '/results'}/${id}` : null);

  const attempts = useMemo(
    () => [...(res.data?.questionAttempts ?? [])].sort(
      (a, b) =>
        String(a.subjectName ?? '').localeCompare(String(b.subjectName ?? '')) ||
        String(a.question.question).localeCompare(String(b.question.question)),
    ),
    [res.data],
  );

  const [filter, setFilter] = useState<'all' | Verdict>('all');

  const counts = useMemo(() => {
    const tally = { all: attempts.length, correct: 0, wrong: 0, skipped: 0 };
    for (const a of attempts) tally[verdictOf(a)] += 1;
    return tally;
  }, [attempts]);

  const visible = filter === 'all' ? attempts : attempts.filter((a) => verdictOf(a) === filter);
  // Number against the full list so a filtered view keeps the original order.
  const indexOf = useMemo(() => new Map(attempts.map((a, i) => [a.id, i])), [attempts]);

  const backLink = (
    <Link
      to={ROUTES.studentResults}
      className="inline-flex min-h-11 items-center gap-2 rounded border border-line bg-white px-4 py-2.5 text-sm font-bold text-brand-800 hover:border-brand-500 hover:text-brand-700"
    >
      <ArrowLeft size={15} aria-hidden="true" /> Back to results
    </Link>
  );

  if (res.loading) {
    return (
      <div className="space-y-4">
        {backLink}
        <LoadingSkeleton rows={6} />
      </div>
    );
  }

  if (res.error || !res.data) {
    return (
      <div className="space-y-4">
        {backLink}
        <ErrorState message={res.error ?? 'Result not found'} onRetry={res.reload} />
      </div>
    );
  }

  const data = res.data;
  const correct = attempts.filter((a) => a.correct).length;
  const subjects = Object.entries(data.subjectNames ?? {});

  const filters: Array<{ key: 'all' | Verdict; label: string; n: number }> = [
    { key: 'all', label: 'All questions', n: counts.all },
    { key: 'correct', label: 'Correct', n: counts.correct },
    { key: 'wrong', label: 'Wrong', n: counts.wrong },
    { key: 'skipped', label: 'Not answered', n: counts.skipped },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand-700">
            {offline ? 'Offline sitting' : 'Online sitting'} · full result
          </p>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-ink">
            {data.exam?.exam_name ?? 'Exam'}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {new Date(data.date).toLocaleString()}
            {data.user?.user_name ? ` · ${data.user.user_name}` : ''}
            {data.user?.class?.name ? ` · ${data.user.class.name}` : ''}
          </p>
        </div>
        {backLink}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Score"
          value={pct(data.overallScore)}
          hint={`${correct} of ${attempts.length || data.total_questions} question(s) correct`}
        />
        <StatTile
          label="Attempted"
          value={`${data.attempted_questions}/${data.total_questions}`}
          hint="Questions you answered"
        />
        <StatTile
          label="Not answered"
          value={String(Math.max(data.total_questions - data.attempted_questions, 0))}
          hint="Left blank or never visited"
        />
      </div>

      {subjects.length > 0 && (
        <Card>
          <CardHead title="Subject breakdown" sub="Correct answers out of questions set per subject" />
          <ul className="grid gap-2 px-5 py-4 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map(([sid, name]) => {
              const rows = attempts.filter((a) => a.question.subjectId === sid);
              const got = rows.filter((a) => a.correct).length;
              return (
                <li key={sid} className="flex items-center justify-between gap-2 rounded border border-line bg-cream px-3 py-2">
                  <span className="truncate text-xs font-bold">{name}</span>
                  <span className="shrink-0 font-mono text-xs font-extrabold text-brand-700">
                    {got}/{rows.length}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Card>
        <CardHead title="Answer sheet" sub={`${attempts.length} question(s) in this sitting`} />
        <div className="flex flex-wrap gap-2 border-b border-line px-5 py-3">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                filter === f.key
                  ? 'border-brand-900 bg-brand-900 text-white'
                  : 'border-line bg-white text-muted hover:border-brand-500 hover:text-brand-700'
              }`}
            >
              {f.label}
              <span className={`rounded-full px-1.5 text-[10px] ${filter === f.key ? 'bg-white/20' : 'bg-brand-50 text-brand-700'}`}>
                {f.n}
              </span>
            </button>
          ))}
        </div>

        {attempts.length === 0 ? (
          <div className="px-5 py-5">
            <EmptyState message="No question attempts were stored for this sitting — only the overall score is available." />
          </div>
        ) : visible.length === 0 ? (
          <div className="px-5 py-5">
            <p className="flex items-center justify-center gap-2 border border-dashed border-line bg-cream px-5 py-6 text-center text-sm text-muted">
              <CircleSlash size={15} aria-hidden="true" /> No questions in this filter.
            </p>
          </div>
        ) : (
          <ol className="space-y-3 px-5 py-5">
            {visible.map((a) => (
              <AttemptCard key={a.id} attempt={a} index={indexOf.get(a.id) ?? 0} />
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
};
