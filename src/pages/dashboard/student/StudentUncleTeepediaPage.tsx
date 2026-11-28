import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Card,
  CardHead,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  PageHeader,
  Pill,
} from '@/components/dashboard/DashboardUI';
import { useToast } from '@/components/ui/Toast';
import {
  useJoinCompetition,
  usePrefetchPlayerState,
  useUncleTeepediaMine,
} from '@/hooks/useUncleTeepediaQueries';
import { ROUTES } from '@/routes/paths';
import { formatLabel, modeLabel, statusTone } from '@/data/uncleteepedia';
import { ArrowRight, Gamepad2, Radio, Trophy, Users } from 'lucide-react';

export const StudentUncleTeepediaPage = () => {
  const list = useUncleTeepediaMine();
  const joinCompetition = useJoinCompetition();
  const prefetchPlayerState = usePrefetchPlayerState();
  const navigate = useNavigate();
  const toast = useToast();
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);

  const join = async () => {
    if (!code.trim()) {
      toast.error('Enter the join code from your host.');
      return;
    }
    setJoining(true);
    try {
      const joined = await joinCompetition.mutateAsync(code.trim());
      toast.success(`Joined ${joined.competition.title}`);
      setCode('');
      if (joined.sessionId) {
        navigate(`${ROUTES.studentUncleTeepedia}/${joined.sessionId}`);
      }
    } catch (error: any) {
      toast.error(error?.message ?? 'Could not join competition');
    } finally {
      setJoining(false);
    }
  };

  const competitions = list.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Live school quiz"
        title="UncleTeepedia"
        text="Join a 60 Seconds of Fame show or a multiple-choice championship with the code your host shares."
      />

      <Card className="overflow-hidden">
        <div className="grid gap-0 md:grid-cols-[1.1fr_.9fr]">
          <div className="bg-brand-900 p-6 text-white sm:p-8">
            <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.22em] text-lime-accent">
              <Radio size={14} /> Join live
            </p>
            <h3 className="mt-2 font-display text-2xl font-extrabold">Got a join code?</h3>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/80">
              Codes look like <span className="font-mono font-bold text-lime-accent">UTP-4K9X2A</span>.
              Ask your quizmaster for the current code, then enter it here.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <input
                value={code}
                onChange={(event) => setCode(event.target.value.toUpperCase())}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void join();
                }}
                placeholder="UTP-XXXXXX"
                className="min-w-0 flex-1 rounded border border-white/25 bg-white/10 px-4 py-3 font-mono text-lg font-bold tracking-widest text-white placeholder:text-white/40 focus:border-lime-accent focus:outline-none"
                maxLength={12}
              />
              <button
                type="button"
                onClick={join}
                disabled={joining}
                className="inline-flex items-center justify-center gap-2 rounded bg-lime-accent px-5 py-3 text-sm font-extrabold text-brand-900 hover:bg-white disabled:opacity-60"
              >
                {joining ? 'Joining…' : 'Join competition'} <ArrowRight size={16} />
              </button>
            </div>
          </div>
          <div className="flex flex-col justify-center gap-3 bg-cream p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <Trophy size={18} />
              </span>
              <div>
                <p className="text-sm font-extrabold text-ink">Two ways to play</p>
                <p className="text-xs text-muted">Hot Seat or Shared Live · Self-paced MCQ</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                <Users size={18} />
              </span>
              <div>
                <p className="text-sm font-extrabold text-ink">Class-restricted shows</p>
                <p className="text-xs text-muted">Your host may limit a competition to your class.</p>
              </div>
            </div>
            <Link
              to={ROUTES.uncleTeepedia}
              className="mt-1 inline-flex items-center gap-2 text-xs font-bold text-brand-700 underline underline-offset-4 hover:text-brand-500"
            >
              Watch live shows <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      </Card>

      {list.isPending && !list.data && <LoadingSkeleton rows={3} />}
      {list.error && <ErrorState message={list.error.message} onRetry={() => list.refetch()} />}
      {!list.isPending && !list.error && competitions.length === 0 && (
        <EmptyState message="You have not joined a competition yet. Enter a join code above." />
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {competitions.map((competition) => {
          const sessionId = competition.sessionId;
          const canEnter = Boolean(sessionId);
          return (
            <Card key={competition.id}>
              <CardHead
                title={competition.title}
                sub={`${formatLabel(competition.format)} · ${modeLabel(competition.gameplayMode)}`}
              />
              <div className="space-y-4 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Pill tone={statusTone(competition.status)}>{competition.status}</Pill>
                  <Pill tone="sky">{competition.questionCount} questions</Pill>
                  {competition.participant && (
                    <Pill tone="emerald">Score {competition.participant.cachedTotalScore}</Pill>
                  )}
                </div>
                {competition.description && (
                  <p className="text-sm leading-relaxed text-muted">{competition.description}</p>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-mono text-xs font-bold tracking-widest text-brand-700">
                    {competition.joinCode}
                  </span>
                  {canEnter ? (
                    <Link
                      to={`${ROUTES.studentUncleTeepedia}/${sessionId}`}
                      onMouseEnter={() => sessionId && prefetchPlayerState(sessionId)}
                      className="inline-flex items-center gap-2 rounded bg-brand-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
                    >
                      <Gamepad2 size={15} />
                      {competition.participant?.status === 'FINISHED' ? 'View result' : 'Enter live room'}
                    </Link>
                  ) : (
                    <span className="rounded border border-dashed border-line px-3 py-2 text-xs font-bold text-muted">
                      Waiting for the host
                    </span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
