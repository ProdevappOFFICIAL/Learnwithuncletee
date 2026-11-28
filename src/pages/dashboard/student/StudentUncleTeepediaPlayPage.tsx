import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, EmptyState, ErrorState, LoadingSkeleton, Pill } from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { apiPost } from '@/lib/api';
import { connectUncleTeepedia, emitAck, requestId } from '@/lib/uncleteepediaSocket';
import { Countdown } from '@/components/uncleteepedia/Countdown';
import { useToast } from '@/components/ui/Toast';
import { ROUTES } from '@/routes/paths';
import {
  modeLabel,
  statusTone,
  type UncleTeepediaLiveState,
  type UncleTeepediaParticipantItem,
} from '@/data/uncleteepedia';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flame,
  Lock,
  Send,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react';

const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

const ScoreChip = ({ participant }: { participant?: UncleTeepediaParticipantItem | null }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-900 px-3 py-1.5 text-xs font-extrabold text-lime-accent">
    <Sparkles size={13} /> {participant?.score ?? 0} pts
  </span>
);

export const StudentUncleTeepediaPlayPage = () => {
  const { sessionId = '' } = useParams();
  const toast = useToast();
  const initial = useResource<UncleTeepediaLiveState>(
    sessionId ? `/uncleteepedia/sessions/${sessionId}/player-state` : null,
  );
  const [liveState, setLiveState] = useState<UncleTeepediaLiveState | null>(null);
  const [practiceState, setPracticeState] = useState<UncleTeepediaLiveState | null>(null);
  const practiceRef = useRef(false);
  const [socketHandle, setSocketHandle] = useState<ReturnType<typeof connectUncleTeepedia> | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    const handle = connectUncleTeepedia<UncleTeepediaLiveState>({
      sessionId,
      onState: (next) => {
        // A practice run is local to this contestant; live official broadcasts
        // must not overwrite the practice question feed.
        if (!practiceRef.current) setLiveState(next);
      },
      onError: (message) => toast.error(message),
    });
    setSocketHandle(handle);
    return () => {
      handle?.disconnect();
      setSocketHandle(null);
    };
  }, [sessionId]);

  const state = practiceState ?? liveState ?? initial.data;
  const mode = state?.competition?.gameplayMode;
  const selfPaced = mode === 'SELF_PACED';
  const attempt = state?.attempt;
  const question = state?.question;
  const participant = (state as any)?.participant as UncleTeepediaParticipantItem | undefined;
  const selected = state?.selectedOption ?? null;
  const round = state?.currentRound;
  const revealed = Boolean(state?.answerRevealed);
  const sessionEnded = state?.session?.status === 'ENDED' || attempt?.status === 'SUBMITTED';

  const deadline = useMemo(() => {
    if (selfPaced) return attempt?.expiresAt ?? null;
    return state?.session?.overallEndsAt ?? null;
  }, [selfPaced, attempt?.expiresAt, state?.session?.overallEndsAt]);

  const refresh = async () => {
    practiceRef.current = false;
    setPracticeState(null);
    await initial.reload();
    setLiveState(null);
  };

  const startPractice = async () => {
    if (!sessionId) return;
    setBusy('practice');
    try {
      const response = await apiPost<UncleTeepediaLiveState>(
        `/uncleteepedia/sessions/${sessionId}/practice-attempts`,
        {},
      );
      practiceRef.current = true;
      setPracticeState(response.data);
      toast.info('Practice run started — this score does not count.');
    } catch (error: any) {
      toast.error(error?.message ?? 'Could not start a practice attempt');
    } finally {
      setBusy(null);
    }
  };

  const startAttempt = async () => {
    if (!sessionId) return;
    setBusy('start');
    try {
      const response = await apiPost<UncleTeepediaLiveState>(
        `/uncleteepedia/sessions/${sessionId}/attempts`,
        {},
      );
      setLiveState(response.data);
    } catch (error: any) {
      toast.error(error?.message ?? 'Could not start your attempt');
    } finally {
      setBusy(null);
    }
  };

  const answer = async (optionIndex: number) => {
    if (!state || selected !== null || !question) return;
    if (round && round.status !== 'OPEN') return;
    setBusy(`answer-${optionIndex}`);
    try {
      const payload = {
        attemptId: attempt?.id,
        questionId: question.id,
        roundId: round?.id,
        optionIndex,
        clientRequestId: requestId(),
      };
      if (practiceRef.current) {
        await apiPost(`/uncleteepedia/attempts/${attempt?.id}/answers`, payload);
        setPracticeState((current) =>
          current ? { ...current, selectedOption: optionIndex } : current,
        );
      } else if (socketHandle?.socket?.connected) {
        await emitAck(socketHandle.socket, 'player:answer', payload);
        setLiveState((current) =>
          current ? { ...current, selectedOption: optionIndex } : current,
        );
      } else {
        await apiPost(`/uncleteepedia/attempts/${attempt?.id}/answers`, payload);
        setLiveState((current) =>
          current ? { ...current, selectedOption: optionIndex } : current,
        );
      }
      toast.info('Answer locked in.');
    } catch (error: any) {
      toast.error(error?.message ?? 'Answer was not accepted');
    } finally {
      setBusy(null);
    }
  };

  const nextQuestion = async () => {
    if (!attempt) return;
    setBusy('next');
    try {
      if (practiceRef.current) {
        const response = await apiPost<UncleTeepediaLiveState>(
          `/uncleteepedia/attempts/${attempt.id}/next`,
          {},
        );
        setPracticeState(response.data);
      } else if (socketHandle?.socket?.connected) {
        const response = await emitAck<{ result: UncleTeepediaLiveState }>(
          socketHandle.socket,
          'player:next',
          { attemptId: attempt.id },
        );
        if (response.result) setLiveState(response.result);
      } else {
        const response = await apiPost<UncleTeepediaLiveState>(
          `/uncleteepedia/attempts/${attempt.id}/next`,
          {},
        );
        setLiveState(response.data);
      }
    } catch (error: any) {
      toast.error(error?.message ?? 'Could not move to the next question');
    } finally {
      setBusy(null);
    }
  };

  const submit = async () => {
    if (!attempt) return;
    if (!window.confirm('Submit your championship now?')) return;
    setBusy('submit');
    try {
      if (practiceRef.current) {
        await apiPost(`/uncleteepedia/attempts/${attempt.id}/submit`, {});
      } else if (socketHandle?.socket?.connected) {
        await emitAck(socketHandle.socket, 'player:submit', { attemptId: attempt.id });
      } else {
        await apiPost(`/uncleteepedia/attempts/${attempt.id}/submit`, {});
      }
      await refresh();
    } catch (error: any) {
      toast.error(error?.message ?? 'Could not submit');
    } finally {
      setBusy(null);
    }
  };

  if (initial.loading && !state) return <LoadingSkeleton rows={5} />;
  if (initial.error && !state) {
    return (
      <div className="space-y-4">
        <ErrorState message={initial.error} onRetry={initial.reload} />
        <Link to={ROUTES.studentUncleTeepedia} className="text-sm font-bold text-brand-700 underline">
          Back to UncleTeepedia
        </Link>
      </div>
    );
  }
  if (!state) return <EmptyState message="This live room could not be found." />;

  const waitingForHost = state.session.status === 'PENDING';
  const onHotSeat = !state.isHotSeat || Boolean(state.isActive);
  const canAnswer =
    Boolean(question) &&
    selected === null &&
    onHotSeat &&
    state.session.status === 'LIVE' &&
    (!round || round.status === 'OPEN');

  if (waitingForHost) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Link to={ROUTES.studentUncleTeepedia} className="inline-flex items-center gap-2 text-xs font-bold text-brand-700">
          <ArrowLeft size={14} /> Back to competitions
        </Link>
        <Card className="overflow-hidden text-center">
          <div className="bg-brand-900 px-6 py-10 text-white">
            <Clock3 className="mx-auto text-lime-accent" size={36} />
            <h2 className="mt-3 font-display text-3xl font-extrabold">{state.competition.title}</h2>
            <p className="mt-2 text-sm text-white/75">
              You are in the waiting room. The host will start the show shortly.
            </p>
            <div className="mt-4 flex justify-center">
              <Pill tone="amber">{state.session.status}</Pill>
            </div>
          </div>
          <div className="p-6 text-sm text-muted">
            Keep this tab open. Questions will appear here the moment the host goes live.
          </div>
        </Card>
      </div>
    );
  }

  if (selfPaced && !attempt) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Link to={ROUTES.studentUncleTeepedia} className="inline-flex items-center gap-2 text-xs font-bold text-brand-700">
          <ArrowLeft size={14} /> Back to competitions
        </Link>
        <Card className="p-8 text-center">
          <Trophy className="mx-auto text-amber-500" size={36} />
          <h2 className="mt-3 font-display text-3xl font-extrabold text-ink">{state.competition.title}</h2>
          <p className="mt-2 text-sm text-muted">
            {modeLabel(state.competition.gameplayMode)} · {state.totalQuestions ?? '—'} questions
          </p>
          {state.competition.rules && (
            <p className="mx-auto mt-4 max-w-lg rounded bg-cream px-4 py-3 text-sm text-muted">
              {state.competition.rules}
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={startAttempt}
              disabled={busy === 'start'}
              className="inline-flex items-center gap-2 rounded bg-brand-500 px-6 py-3 text-sm font-extrabold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              <Flame size={16} /> {busy === 'start' ? 'Starting…' : 'Start championship'}
            </button>
            {state.competition.allowPracticeAttempts && (
              <button
                type="button"
                onClick={startPractice}
                disabled={busy === 'practice'}
                className="inline-flex items-center gap-2 rounded border border-line px-6 py-3 text-sm font-extrabold text-brand-800 hover:bg-brand-50 disabled:opacity-60"
              >
                Practice run
              </button>
            )}
          </div>
        </Card>
      </div>
    );
  }

  if (selfPaced && attempt && (attempt.status === 'SUBMITTED' || attempt.status === 'EXPIRED' || sessionEnded)) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Card className="p-8 text-center">
          <CheckCircle2 className="mx-auto text-emerald-500" size={40} />
          <h2 className="mt-3 font-display text-3xl font-extrabold text-ink">Championship complete</h2>
          <p className="mt-2 text-sm text-muted">{state.competition.title}</p>
          <p className="mt-5 font-display text-6xl font-black text-brand-700">{attempt.score ?? participant?.score ?? 0}</p>
          <p className="text-xs font-bold uppercase tracking-widest text-muted">points</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link
              to={ROUTES.studentUncleTeepedia}
              className="rounded bg-brand-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
            >
              Back to competitions
            </Link>
            {state.competition.allowPracticeAttempts && (
              <button
                type="button"
                onClick={startPractice}
                disabled={busy === 'practice'}
                className="rounded border border-brand-300 px-4 py-2.5 text-sm font-bold text-brand-800 hover:bg-brand-50 disabled:opacity-60"
              >
                Practice again
              </button>
            )}
            <Link
              to={ROUTES.uncleTeepedia}
              className="rounded border border-line px-4 py-2.5 text-sm font-bold text-brand-800 hover:bg-brand-50"
            >
              Watch live shows
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const progress = selfPaced && attempt
    ? `${Math.min((attempt.currentQuestionIndex ?? 0) + 1, attempt.totalQuestions ?? 0)} / ${attempt.totalQuestions ?? 0}`
    : null;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to={ROUTES.studentUncleTeepedia} className="inline-flex items-center gap-2 text-xs font-bold text-brand-700">
          <ArrowLeft size={14} /> Leave room
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <Pill tone={statusTone(state.session.status)}>{state.session.status}</Pill>
          {attempt?.kind === 'PRACTICE' && <Pill tone="violet">Practice</Pill>}
          {progress && <Pill tone="sky">{progress}</Pill>}
          <ScoreChip participant={participant || { id: '', name: '', status: '', score: attempt?.score ?? 0, correctAnswers: 0, totalAnswers: 0 }} />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-brand-900 px-5 py-4 text-white">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.22em] text-lime-accent">
              {modeLabel(state.competition.gameplayMode)}
            </p>
            <h2 className="mt-1 font-display text-xl font-extrabold sm:text-2xl">
              {state.competition.title}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {revealed && round?.revealEndsAt && (
              <Countdown endsAt={round.revealEndsAt} label="Reveal" size="sm" tone="light" />
            )}
            <Countdown
              endsAt={deadline}
              pausedAt={state.session.status === 'PAUSED' ? state.session.pausedAt : null}
              label={selfPaced ? 'Your time' : '60 second clock'}
              tone="light"
            />
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          {state.session.status === 'PAUSED' && (
            <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
              The host paused the show. Your clock is frozen.
            </div>
          )}

          {state.isHotSeat && !onHotSeat && (
            <div className="rounded border border-sky-200 bg-sky-50 px-4 py-5 text-center">
              <Clock3 className="mx-auto text-sky-600" size={28} />
              <p className="mt-2 font-display text-xl font-extrabold text-sky-900">
                It is not your turn yet
              </p>
              <p className="mt-1 text-sm text-sky-800">
                Another contestant is on the hot seat. Questions stay hidden until the host calls
                your name.
              </p>
            </div>
          )}

          {!question && onHotSeat && !sessionEnded && (
            <EmptyState message="Waiting for the host to open the next question…" />
          )}

          {question && onHotSeat && (
            <>
              <p className="font-display text-2xl font-extrabold leading-snug text-ink sm:text-3xl">
                {question.question}
              </p>

              <div className="grid gap-2 sm:grid-cols-2">
                {question.options.map((option, index) => {
                  const isSelected = selected === index;
                  const correct = revealed && question.correctOption === index;
                  const wrongSelection = revealed && isSelected && question.correctOption !== index;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => answer(index)}
                      disabled={!canAnswer || busy === `answer-${index}`}
                      className={`flex items-center gap-3 rounded border px-4 py-4 text-left text-sm transition ${
                        correct
                          ? 'border-emerald-400 bg-emerald-50 font-bold text-emerald-900'
                          : wrongSelection
                            ? 'border-rose-300 bg-rose-50 font-bold text-rose-900'
                            : isSelected
                              ? 'border-brand-500 bg-brand-50 font-bold text-brand-900'
                              : 'border-line bg-white text-ink hover:border-brand-400 hover:bg-brand-50/40'
                      } disabled:cursor-default`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-900 text-xs font-extrabold text-white">
                        {letters[index] ?? index + 1}
                      </span>
                      <span className="min-w-0 flex-1">{option}</span>
                      {correct && <CheckCircle2 size={17} className="text-emerald-600" />}
                      {wrongSelection && <XCircle size={17} className="text-rose-600" />}
                      {isSelected && !revealed && <Lock size={15} className="text-brand-600" />}
                    </button>
                  );
                })}
              </div>

              <div className="rounded border border-line bg-cream px-4 py-3 text-sm text-muted">
                {revealed ? (
                  state.myAnswerCorrect == null ? (
                    <span>No answer was recorded for this question.</span>
                  ) : state.myAnswerCorrect ? (
                    <span className="flex items-center gap-2 font-bold text-emerald-700">
                      <CheckCircle2 size={16} /> Correct! The host has revealed the answer.
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 font-bold text-rose-700">
                      <XCircle size={16} /> Not this time. The correct answer is highlighted.
                    </span>
                  )
                ) : selected !== null ? (
                  <span className="flex items-center gap-2 font-bold text-brand-800">
                    <Lock size={15} /> Answer locked in. The host controls the reveal.
                  </span>
                ) : (
                  <span>Choose one option. Answers are hidden from other contestants and viewers.</span>
                )}
              </div>
            </>
          )}

          {selfPaced && question && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] font-bold uppercase tracking-[.22em] text-muted">
                  Question {progress}
                </p>
                <p className="text-xs text-muted">
                  Score: <span className="font-extrabold text-brand-700">{attempt?.score ?? 0}</span>
                </p>
              </div>
              <p className="font-display text-2xl font-extrabold leading-snug text-ink sm:text-3xl">
                {question.question}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {question.options.map((option, index) => {
                  const isSelected = selected === index;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => answer(index)}
                      disabled={selected !== null || busy === `answer-${index}`}
                      className={`flex items-center gap-3 rounded border px-4 py-4 text-left text-sm transition ${
                        isSelected
                          ? 'border-brand-500 bg-brand-50 font-bold text-brand-900'
                          : 'border-line bg-white text-ink hover:border-brand-400 hover:bg-brand-50/40'
                      } disabled:cursor-default disabled:opacity-80`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-900 text-xs font-extrabold text-white">
                        {letters[index] ?? index + 1}
                      </span>
                      <span className="min-w-0 flex-1">{option}</span>
                      {isSelected && <Lock size={15} className="text-brand-600" />}
                    </button>
                  );
                })}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-line bg-cream px-4 py-3">
                <p className="text-sm text-muted">
                  {selected !== null
                    ? 'Answer saved. Move on when you are ready.'
                    : 'You can change your mind until you move to the next question.'}
                </p>
                <div className="flex gap-2">
                  {selected !== null && (
                    <button
                      type="button"
                      onClick={nextQuestion}
                      disabled={busy === 'next'}
                      className="inline-flex items-center gap-2 rounded bg-brand-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
                    >
                      {busy === 'next' ? 'Moving…' : 'Next question'} <ChevronRight size={15} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={submit}
                    disabled={busy === 'submit'}
                    className="inline-flex items-center gap-2 rounded border border-line px-4 py-2.5 text-sm font-bold text-brand-800 hover:bg-white disabled:opacity-60"
                  >
                    <Send size={14} /> Submit
                  </button>
                </div>
              </div>
            </>
          )}

          {!selfPaced && sessionEnded && (
            <div className="rounded border border-line bg-cream px-4 py-6 text-center">
              <Trophy className="mx-auto text-amber-500" size={30} />
              <p className="mt-2 font-display text-2xl font-extrabold text-ink">Show ended</p>
              <p className="mt-1 text-sm text-muted">
                Final score: <span className="font-extrabold text-brand-700">{participant?.score ?? 0}</span>
              </p>
            </div>
          )}
        </div>
      </Card>

      {state.competition.rules && (
        <p className="px-1 text-xs leading-relaxed text-muted">{state.competition.rules}</p>
      )}
    </div>
  );
};
