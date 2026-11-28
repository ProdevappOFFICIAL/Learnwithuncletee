import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Container } from '@/components/ui/Container';
import { apiGetPublic } from '@/lib/api';
import { connectUncleTeepedia } from '@/lib/uncleteepediaSocket';
import { Countdown } from '@/components/uncleteepedia/Countdown';
import {
  modeLabel,
  statusTone,
  type UncleTeepediaLiveState,
  type UncleTeepediaParticipantItem,
} from '@/data/uncleteepedia';
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  Radio,
  Trophy,
  UserRoundCheck,
  Users,
  XCircle,
} from 'lucide-react';

const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

const initials = (name: string) =>
  name
    .split(' ')
    .map((part) => part.replace('.', '')[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

const toneClass: Record<string, string> = {
  amber: 'border-amber-200 bg-amber-100 text-amber-900',
  emerald: 'border-emerald-200 bg-emerald-100 text-emerald-900',
  sky: 'border-sky-200 bg-sky-100 text-sky-900',
  violet: 'border-violet-200 bg-violet-100 text-violet-900',
  ink: 'border-brand-900 bg-brand-900 text-white',
  rose: 'border-rose-200 bg-rose-100 text-rose-900',
};

export const UncleTeepediaWatchPage = () => {
  const { sessionId = '' } = useParams();
  const [state, setState] = useState<UncleTeepediaLiveState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [handle, setHandle] = useState<ReturnType<typeof connectUncleTeepedia> | null>(null);
  const [followId, setFollowId] = useState('');

  useEffect(() => {
    if (!sessionId) return;
    let mounted = true;
    apiGetPublic<UncleTeepediaLiveState>(`/public-uncleteepedia/sessions/${sessionId}`)
      .then((response) => {
        if (mounted) setState(response.data);
      })
      .catch((reason) => {
        if (mounted) setError(reason?.message ?? 'Could not load this live show');
      });

    const connection = connectUncleTeepedia<UncleTeepediaLiveState>({
      sessionId,
      forceViewer: true,
      onState: (next) => setState(next),
      onError: (message) => setError(message),
    });
    setHandle(connection);
    return () => {
      mounted = false;
      connection?.disconnect();
      setHandle(null);
    };
  }, [sessionId]);

  const participants = useMemo(
    () => (state?.participants ?? []) as UncleTeepediaParticipantItem[],
    [state?.participants],
  );
  const round = state?.currentRound;
  const revealed = round?.status === 'REVEALED';
  const question = state?.question;
  const correctOption = revealed ? question?.correctOption ?? round?.correctOption ?? null : null;
  const isHotSeat = state?.competition.gameplayMode === 'HOT_SEAT';
  const activeParticipantId = state?.session.activeParticipantId;

  const follow = (participantId: string) => {
    setFollowId(participantId);
    handle?.follow(participantId || null);
  };

  if (error && !state) {
    return (
      <Layout>
        <Container className="py-20 text-center">
          <p className="text-sm font-bold text-rose-700">{error}</p>
          <Link to="/uncleteepedia" className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-brand-700">
            <ArrowLeft size={15} /> Back to UncleTeepedia
          </Link>
        </Container>
      </Layout>
    );
  }

  if (!state) {
    return (
      <Layout>
        <Container className="py-20">
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="h-40 animate-pulse rounded bg-brand-50" />
            <div className="h-64 animate-pulse rounded bg-brand-50" />
          </div>
        </Container>
      </Layout>
    );
  }

  const ended = state.session.status === 'ENDED';
  const pending = state.session.status === 'PENDING';

  return (
    <Layout>
      <section className="bg-brand-900 py-8 text-white sm:py-10">
        <Container>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Link
                to="/uncleteepedia"
                className="inline-flex items-center gap-2 text-xs font-bold text-white/70 hover:text-white"
              >
                <ArrowLeft size={14} /> All live shows
              </Link>
              <p className="mt-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.22em] text-lime-accent">
                <Radio size={14} /> {ended ? 'Replay' : 'Live viewers page'}
              </p>
              <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-5xl">
                {state.competition.title}
              </h1>
              <p className="mt-2 text-sm text-white/75">
                {modeLabel(state.competition.gameplayMode)} · {state.competition.rules ?? 'Host-led live quiz'}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest ${
                  toneClass[statusTone(state.session.status)]
                }`}
              >
                {state.session.status}
              </span>
              <Countdown
                endsAt={state.session.overallEndsAt}
                pausedAt={state.session.status === 'PAUSED' ? state.session.pausedAt : null}
                label="Overall clock"
                tone="light"
              />
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-8 sm:py-10">
        {pending && (
          <div className="rounded border border-dashed border-line bg-cream px-6 py-16 text-center">
            <Eye className="mx-auto text-brand-500" size={36} />
            <h2 className="mt-3 font-display text-2xl font-extrabold text-ink">The show is about to begin</h2>
            <p className="mt-2 text-sm text-muted">
              The host has not started this session yet. Keep this page open — questions appear
              automatically.
            </p>
          </div>
        )}

        {!pending && (
          <div className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
            <div className="space-y-6">
              <section className="overflow-hidden rounded border border-line bg-white">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-cream px-5 py-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-700">
                    {round ? `Question ${round.roundNumber}` : 'Current question'}
                  </p>
                  <div className="flex items-center gap-2">
                    {revealed && round?.revealEndsAt && (
                      <Countdown endsAt={round.revealEndsAt} label="Next round" size="sm" />
                    )}
                    {isHotSeat && activeParticipantId && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-900">
                        <UserRoundCheck size={12} /> Hot seat
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-5 p-5 sm:p-7">
                  {!question && <p className="text-sm text-muted">Waiting for the next question…</p>}
                  {question && (
                    <>
                      <h2 className="font-display text-2xl font-extrabold leading-snug text-ink sm:text-4xl">
                        {question.question}
                      </h2>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {question.options.map((option, index) => {
                          const correct = revealed && correctOption === index;
                          const answers = participants.filter(
                            (participant) => participant.answer?.optionIndex === index,
                          );
                          return (
                            <div
                              key={index}
                              className={`rounded border px-4 py-3 ${
                                correct
                                  ? 'border-emerald-400 bg-emerald-50 text-emerald-950'
                                  : 'border-line bg-white text-ink'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-900 text-xs font-extrabold text-white">
                                  {letters[index] ?? index + 1}
                                </span>
                                <span className={`text-sm ${correct ? 'font-extrabold' : 'font-semibold'}`}>
                                  {option}
                                </span>
                                {correct && <CheckCircle2 className="ml-auto" size={18} />}
                              </div>
                              {answers.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1.5 pl-11">
                                  {answers.map((participant) => (
                                    <span
                                      key={participant.id}
                                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                                        revealed
                                          ? participant.answer?.isCorrect
                                            ? 'bg-emerald-200 text-emerald-900'
                                            : 'bg-rose-200 text-rose-900'
                                          : 'bg-brand-100 text-brand-800'
                                      }`}
                                    >
                                      {participant.name.split(' ')[0]}
                                      {revealed &&
                                        (participant.answer?.isCorrect ? (
                                          <CheckCircle2 size={10} />
                                        ) : (
                                          <XCircle size={10} />
                                        ))}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <p className="rounded bg-cream px-4 py-3 text-xs text-muted">
                        {revealed
                          ? question.explanation ?? 'The host has revealed the correct answer.'
                          : 'Correct answers stay hidden until the host reveals them.'}
                      </p>
                    </>
                  )}
                </div>
              </section>

              {state.follow && (
                <section className="rounded border border-line bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-700">
                      <UserRoundCheck size={14} /> Following {state.follow.participant.name}
                    </p>
                    <span className="text-xs font-bold text-muted">
                      Question {state.follow.currentQuestionIndex + 1} / {state.follow.totalQuestions}
                    </span>
                  </div>
                  <div className="space-y-3 p-5">
                    {state.follow.question ? (
                      <>
                        <p className="font-display text-xl font-extrabold text-ink">
                          {state.follow.question.question}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {state.follow.question.options.map((option, index) => (
                            <span
                              key={index}
                              className={`rounded border px-3 py-1.5 text-xs ${
                                state.follow?.selectedOption === index
                                  ? 'border-brand-500 bg-brand-50 font-bold text-brand-900'
                                  : 'border-line text-muted'
                              }`}
                            >
                              {letters[index] ?? index + 1}. {option}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-muted">
                          {state.follow.selectedOption != null
                            ? `Answered option ${letters[state.follow.selectedOption] ?? state.follow.selectedOption + 1}. Correctness stays private until the host reveals it.`
                            : 'This contestant has not answered the current question yet.'}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted">This contestant is between questions.</p>
                    )}
                  </div>
                </section>
              )}
            </div>

            <aside className="space-y-6">
              <section className="rounded border border-line bg-white">
                <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
                  <h2 className="flex items-center gap-2 text-sm font-extrabold text-ink">
                    <Users size={15} /> Contestants
                  </h2>
                  <span className="text-xs text-muted">{participants.length}</span>
                </div>
                {participants.length > 0 && (
                  <div className="border-b border-line px-5 py-3">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted">
                      Follow a contestant
                      <select
                        value={followId}
                        onChange={(event) => follow(event.target.value)}
                        className="mt-1 w-full rounded border border-line px-3 py-2 text-sm font-normal normal-case tracking-normal text-ink"
                      >
                        <option value="">Choose a contestant…</option>
                        {participants.map((participant) => (
                          <option key={participant.id} value={participant.id}>
                            {participant.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                )}
                <div className="divide-y divide-line">
                  {participants.length === 0 && (
                    <p className="px-5 py-8 text-center text-sm text-muted">No contestants joined yet.</p>
                  )}
                  {participants.map((participant) => {
                    const answer = participant.answer;
                    const onSeat = activeParticipantId === participant.id;
                    return (
                      <div key={participant.id} className={`flex items-center gap-3 px-5 py-3 ${onSeat ? 'bg-amber-50' : ''}`}>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-900 text-[10px] font-extrabold text-lime-accent">
                          {initials(participant.name)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-ink">{participant.name}</p>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                            {onSeat ? 'On the hot seat' : participant.status.toLowerCase()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-display text-lg font-extrabold text-brand-700">{participant.score}</p>
                          <p className="text-[10px] text-muted">
                            {answer
                              ? `${letters[answer.optionIndex] ?? answer.optionIndex + 1} selected`
                              : participant.totalAnswers
                                ? `${participant.correctAnswers}/${participant.totalAnswers}`
                                : '—'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              {(state.leaderboard?.length ?? 0) > 0 && (
                <section className="rounded border border-line bg-white">
                  <div className="flex items-center gap-2 border-b border-line px-5 py-3">
                    <Trophy size={15} className="text-amber-500" />
                    <h2 className="text-sm font-extrabold text-ink">Leaderboard</h2>
                  </div>
                  <div className="divide-y divide-line">
                    {(state.leaderboard ?? []).slice(0, 10).map((row, index) => (
                      <div key={row.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                        <span className="w-5 text-xs font-extrabold text-muted">{index + 1}</span>
                        <span className="min-w-0 flex-1 truncate font-semibold text-ink">{row.name}</span>
                        <span className="font-display text-base font-extrabold text-brand-700">{row.score}</span>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {ended && (
                <div className="rounded border border-amber-200 bg-amber-50 p-5 text-center text-sm text-amber-900">
                  <Trophy className="mx-auto text-amber-500" size={28} />
                  <p className="mt-2 font-display text-xl font-extrabold">Show ended</p>
                  <p className="mt-1 text-xs">Final scores remain on the leaderboard.</p>
                </div>
              )}
            </aside>
          </div>
        )}
      </Container>
    </Layout>
  );
};
