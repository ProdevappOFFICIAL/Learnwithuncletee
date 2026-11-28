import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Card,
  CardHead,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  Modal,
  PageHeader,
  Pill,
  TableWrap,
  Td,
  Th,
} from '@/components/dashboard/DashboardUI';
import { useResource } from '@/context/AuthContext';
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api';
import { connectUncleTeepedia, emitAck, requestId } from '@/lib/uncleteepediaSocket';
import { Countdown } from '@/components/uncleteepedia/Countdown';
import { useToast } from '@/components/ui/Toast';
import {
  formatLabel,
  modeLabel,
  statusTone,
  type UncleTeepediaCompetitionItem,
  type UncleTeepediaLiveState,
  type UncleTeepediaQuestionItem,
} from '@/data/uncleteepedia';
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Eye,
  Pause,
  Play,
  Plus,
  RotateCcw,
  SkipForward,
  Square,
  Trash2,
  Trophy,
  XCircle,
} from 'lucide-react';

interface SourceQuestion {
  id: string;
  question: string;
  correct_answer: string;
  incorrect_answers?: string[] | null;
  explanation?: string | null;
  img?: string | null;
  subject?: { name?: string } | null;
}

interface QuestionDraft {
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
  imageUrl: string;
}

const blankDraft = (): QuestionDraft => ({
  question: '',
  options: ['', '', '', ''],
  correctOption: 0,
  explanation: '',
  imageUrl: '',
});

const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

/** ── Question manager ─────────────────────────────────────────────────────── */
const QuestionManager = ({
  competition,
  reload,
}: {
  competition: UncleTeepediaCompetitionItem;
  reload: () => void;
}) => {
  const toast = useToast();
  const [draft, setDraft] = useState<QuestionDraft>(blankDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const questions = competition.questions ?? [];
  const sources = useResource<SourceQuestion[]>('/questions', { limit: 200 });

  const reset = () => {
    setDraft(blankDraft());
    setEditingId(null);
  };

  const save = async () => {
    const options = draft.options.map((option) => option.trim()).filter(Boolean);
    if (!draft.question.trim() || options.length < 2) {
      toast.error('A question needs text and at least two options.');
      return;
    }
    if (draft.correctOption >= options.length) {
      toast.error('Choose one of the provided options as the correct answer.');
      return;
    }
    setBusy(true);
    try {
      if (editingId) {
        await apiPut(`/uncleteepedia/competitions/${competition.id}/questions/${editingId}`, {
          question: draft.question,
          options,
          correctOption: draft.correctOption,
          explanation: draft.explanation,
          imageUrl: draft.imageUrl,
        });
        toast.success('Question updated');
      } else {
        await apiPost(`/uncleteepedia/competitions/${competition.id}/questions`, {
          questions: [
            {
              question: draft.question,
              options,
              correctOption: draft.correctOption,
              explanation: draft.explanation,
              imageUrl: draft.imageUrl,
            },
          ],
        });
        toast.success('Question added');
      }
      reset();
      reload();
    } catch (error: any) {
      toast.error(error?.message ?? 'Could not save question');
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (question: UncleTeepediaQuestionItem) => {
    setEditingId(question.id);
    setDraft({
      question: question.question,
      options: [...question.options, '', '', '', ''].slice(0, Math.max(4, question.options.length)),
      correctOption: question.correctOption,
      explanation: question.explanation ?? '',
      imageUrl: question.imageUrl ?? '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (question: UncleTeepediaQuestionItem) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await apiDelete(`/uncleteepedia/competitions/${competition.id}/questions/${question.id}`);
      toast.success('Question deleted');
      reload();
    } catch (error: any) {
      toast.error(error?.message ?? 'Could not delete question');
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const next = [...questions];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    try {
      await apiPost(`/uncleteepedia/competitions/${competition.id}/questions/reorder`, {
        questionIds: next.map((question) => question.id),
      });
      reload();
    } catch (error: any) {
      toast.error(error?.message ?? 'Could not reorder questions');
    }
  };

  const importSelected = async () => {
    if (!selectedSources.length) return;
    setBusy(true);
    try {
      await apiPost(`/uncleteepedia/competitions/${competition.id}/questions/import`, {
        questionIds: selectedSources,
      });
      toast.success(`${selectedSources.length} question(s) imported`);
      setSelectedSources([]);
      setImportOpen(false);
      reload();
    } catch (error: any) {
      toast.error(error?.message ?? 'Import failed');
    } finally {
      setBusy(false);
    }
  };

  const optionLabel = (text: string, index: number) => `${letters[index] ?? index + 1}. ${text}`;

  return (
    <Card>
      <CardHead
        title="Question manager"
        sub={`${questions.length} question(s) · import from the question bank or write manually`}
        link={undefined}
      />
      <div className="space-y-5 p-5">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="inline-flex items-center gap-2 rounded bg-brand-900 px-3 py-2 text-xs font-bold text-white hover:bg-brand-700"
          >
            <Download size={14} /> Import from question bank
          </button>
          {editingId && (
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center gap-2 rounded border border-line px-3 py-2 text-xs font-bold text-brand-800 hover:bg-brand-50"
            >
              <RotateCcw size={14} /> Cancel edit
            </button>
          )}
        </div>

        <div className="rounded border border-dashed border-line bg-cream/60 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-700">
            {editingId ? 'Edit question' : 'Add a question manually'}
          </p>
          <textarea
            value={draft.question}
            onChange={(event) => setDraft((current) => ({ ...current, question: event.target.value }))}
            rows={2}
            placeholder="Type the question the host will read aloud…"
            className="mt-3 w-full rounded border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-500"
          />
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {draft.options.map((option, index) => (
              <label key={index} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="correct-option"
                  checked={draft.correctOption === index}
                  onChange={() => setDraft((current) => ({ ...current, correctOption: index }))}
                  className="accent-brand-600"
                  aria-label={`Option ${letters[index]} is correct`}
                />
                <span className="w-5 text-xs font-bold text-muted">{letters[index]}</span>
                <input
                  value={option}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      options: current.options.map((value, position) =>
                        position === index ? event.target.value : value,
                      ),
                    }))
                  }
                  placeholder={`Option ${letters[index]}`}
                  className="w-full rounded border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
                />
              </label>
            ))}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <input
              value={draft.explanation}
              onChange={(event) => setDraft((current) => ({ ...current, explanation: event.target.value }))}
              placeholder="Explanation (optional)"
              className="rounded border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
            <input
              value={draft.imageUrl}
              onChange={(event) => setDraft((current) => ({ ...current, imageUrl: event.target.value }))}
              placeholder="Image URL (optional)"
              className="rounded border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </div>
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="mt-3 inline-flex items-center gap-2 rounded bg-brand-500 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            <Plus size={14} /> {editingId ? 'Save changes' : 'Add question'}
          </button>
        </div>

        {questions.length === 0 ? (
          <EmptyState message="No questions yet. Import from the bank or add one above." />
        ) : (
          <div className="space-y-3">
            {questions.map((question, index) => (
              <div key={question.id} className="rounded border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-900 text-xs font-extrabold text-white">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-semibold text-ink">{question.question}</p>
                      <div className="mt-2 grid gap-1 sm:grid-cols-2">
                        {question.options.map((option, optionIndex) => (
                          <p
                            key={optionIndex}
                            className={`rounded px-2 py-1 text-xs ${
                              optionIndex === question.correctOption
                                ? 'bg-emerald-50 font-bold text-emerald-800'
                                : 'text-muted'
                            }`}
                          >
                            {optionLabel(option, optionIndex)}
                            {optionIndex === question.correctOption && ' ✓'}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      className="rounded border border-line p-1.5 text-brand-700 hover:bg-brand-50 disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ArrowUp size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => move(index, 1)}
                      disabled={index === questions.length - 1}
                      className="rounded border border-line p-1.5 text-brand-700 hover:bg-brand-50 disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ArrowDown size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(question)}
                      className="rounded border border-line px-2 py-1.5 text-xs font-bold text-brand-700 hover:bg-brand-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(question)}
                      className="rounded border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
                      aria-label="Delete question"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import from question bank" size="xl">
        <div className="space-y-4">
          {sources.loading && <LoadingSkeleton rows={3} />}
          {sources.error && <ErrorState message={sources.error} onRetry={sources.reload} />}
          <div className="max-h-[420px] space-y-2 overflow-y-auto">
            {(sources.data ?? []).map((source) => (
              <label
                key={source.id}
                className="flex cursor-pointer items-start gap-3 rounded border border-line p-3 text-sm hover:border-brand-400"
              >
                <input
                  type="checkbox"
                  checked={selectedSources.includes(source.id)}
                  onChange={() =>
                    setSelectedSources((current) =>
                      current.includes(source.id)
                        ? current.filter((id) => id !== source.id)
                        : [...current, source.id],
                    )
                  }
                  className="mt-1 accent-brand-600"
                />
                <span>
                  <span className="font-semibold text-ink">{source.question}</span>
                  <span className="mt-1 block text-xs text-muted">
                    {source.subject?.name ?? 'Question bank'} · answer: {source.correct_answer}
                  </span>
                </span>
              </label>
            ))}
            {(sources.data ?? []).length === 0 && !sources.loading && (
              <EmptyState message="The question bank is empty for this workspace." />
            )}
          </div>
          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button
              type="button"
              onClick={() => setImportOpen(false)}
              className="rounded border border-line px-4 py-2 text-sm font-bold text-brand-800 hover:bg-brand-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={importSelected}
              disabled={busy || selectedSources.length === 0}
              className="rounded bg-brand-500 px-4 py-2 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Import {selectedSources.length || ''}
            </button>
          </div>
        </div>
      </Modal>
    </Card>
  );
};

/** ── Host control room ────────────────────────────────────────────────────── */
const HostController = ({
  sessionId,
  onRefreshCompetition,
}: {
  sessionId: string;
  onRefreshCompetition: () => void;
}) => {
  const toast = useToast();
  const [state, setState] = useState<UncleTeepediaLiveState | null>(null);
  const [socketHandle, setSocketHandle] = useState<ReturnType<typeof connectUncleTeepedia> | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    setState(null);
    setConnected(false);
    const handle = connectUncleTeepedia<UncleTeepediaLiveState>({
      sessionId,
      onState: (next) => setState(next),
      onError: (message) => toast.error(message),
    });
    setSocketHandle(handle);
    const socket = handle?.socket;
    socket?.on('connect', () => setConnected(true));
    socket?.on('disconnect', () => setConnected(false));
    return () => {
      handle?.disconnect();
      setSocketHandle(null);
      setConnected(false);
    };
  }, [sessionId]);

  const reload = async () => {
    try {
      const response = await apiGet<UncleTeepediaLiveState>(`/uncleteepedia/sessions/${sessionId}/state`);
      setState(response.data);
    } catch (error: any) {
      toast.error(error?.message ?? 'Could not load control room');
    }
  };

  useEffect(() => {
    if (!state) void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const command = async (event: string, path: string, payload: any = {}) => {
    setBusy(event);
    try {
      if (socketHandle?.socket?.connected) {
        await emitAck(socketHandle.socket, event, { ...payload, requestId: requestId() });
      } else {
        await apiPost(path, payload);
        await reload();
      }
      onRefreshCompetition();
    } catch (error: any) {
      toast.error(error?.message ?? 'Command failed');
    } finally {
      setBusy(null);
    }
  };

  const start = () =>
    command('host:start', `/uncleteepedia/sessions/${sessionId}/start`);
  const pause = () =>
    command('host:pause', `/uncleteepedia/sessions/${sessionId}/pause`);
  const resume = () =>
    command('host:resume', `/uncleteepedia/sessions/${sessionId}/resume`);
  const next = () =>
    command('host:next', `/uncleteepedia/sessions/${sessionId}/rounds/next`);
  const skip = () =>
    command('host:skip', `/uncleteepedia/sessions/${sessionId}/rounds/skip`);
  const reveal = () =>
    command('host:reveal', `/uncleteepedia/sessions/${sessionId}/rounds/reveal`);
  const end = () => {
    if (!window.confirm('End this live session for everyone?')) return;
    void command('host:end', `/uncleteepedia/sessions/${sessionId}/end`);
  };
  const spotlight = (participantId: string) =>
    command(
      'host:spotlight',
      `/uncleteepedia/sessions/${sessionId}/spotlight/${participantId}`,
      { participantId },
    );

  if (!state) return <LoadingSkeleton rows={4} />;

  const session = state.session;
  const round = state.currentRound;
  const question = state.question;
  const revealDone = round?.status === 'REVEALED';
  const isSelfPaced = state.competition.gameplayMode === 'SELF_PACED';
  const live = session.status === 'LIVE';
  const paused = session.status === 'PAUSED';
  const ended = session.status === 'ENDED';

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-brand-900 px-5 py-4 text-white">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.22em] text-lime-accent">
              Host control room
            </p>
            <h3 className="mt-1 font-display text-2xl font-extrabold">{state.competition.title}</h3>
            <p className="mt-1 text-xs text-white/70">
              {modeLabel(state.competition.gameplayMode)} ·{' '}
              <span className={connected ? 'text-emerald-300' : 'text-amber-300'}>
                {connected ? 'live connection' : 'reconnecting…'}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone={statusTone(session.status)}>{session.status}</Pill>
            <Countdown
              endsAt={session.overallEndsAt}
              pausedAt={session.pausedAt}
              label="Overall clock"
              tone="light"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 border-b border-line p-4">
          {!live && !paused && !ended && (
            <button
              type="button"
              onClick={start}
              disabled={busy === 'host:start'}
              className="inline-flex items-center gap-2 rounded bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              <Play size={15} /> Start live
            </button>
          )}
          {live && (
            <button
              type="button"
              onClick={pause}
              disabled={busy === 'host:pause'}
              className="inline-flex items-center gap-2 rounded border border-line px-4 py-2.5 text-sm font-bold text-brand-800 hover:bg-brand-50"
            >
              <Pause size={15} /> Pause
            </button>
          )}
          {paused && (
            <button
              type="button"
              onClick={resume}
              disabled={busy === 'host:resume'}
              className="inline-flex items-center gap-2 rounded bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
            >
              <Play size={15} /> Resume
            </button>
          )}
          {!ended && !isSelfPaced && (
            <>
              <button
                type="button"
                onClick={reveal}
                disabled={!live || revealDone || busy === 'host:reveal'}
                className="inline-flex items-center gap-2 rounded bg-amber-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-40"
              >
                <Eye size={15} /> Reveal answer
              </button>
              <button
                type="button"
                onClick={next}
                disabled={!live || busy === 'host:next'}
                className="inline-flex items-center gap-2 rounded bg-brand-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-40"
              >
                <ChevronRight size={15} /> Next question
              </button>
              <button
                type="button"
                onClick={skip}
                disabled={!live || busy === 'host:skip'}
                className="inline-flex items-center gap-2 rounded border border-line px-4 py-2.5 text-sm font-bold text-brand-800 hover:bg-brand-50 disabled:opacity-40"
              >
                <SkipForward size={15} /> Skip
              </button>
            </>
          )}
          {!ended && (
            <button
              type="button"
              onClick={end}
              disabled={busy === 'host:end'}
              className="inline-flex items-center gap-2 rounded border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-700 hover:bg-rose-50"
            >
              <Square size={14} /> End session
            </button>
          )}
        </div>
      </Card>

      {ended && (
        <Card className="p-6 text-center">
          <Trophy className="mx-auto text-amber-500" size={32} />
          <h3 className="mt-2 font-display text-2xl font-extrabold text-ink">Session ended</h3>
          <p className="mt-1 text-sm text-muted">The leaderboard is final. View it below.</p>
        </Card>
      )}

      {!ended && !isSelfPaced && (
        <Card>
          <CardHead
            title={`Round ${round?.roundNumber ?? 0}`}
            sub={
              round?.status === 'REVEALED'
                ? 'Answer revealed to pupils and viewers'
                : 'Question is open — answers stay hidden until you reveal'
            }
          />
          <div className="space-y-4 p-5">
            {!question && <EmptyState message="Waiting for the first question. Press Start live." />}
            {question && (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Pill tone={round?.status === 'REVEALED' ? 'emerald' : 'sky'}>
                    {round?.status ?? 'PENDING'}
                  </Pill>
                  {round?.status === 'REVEALED' && round.revealEndsAt && (
                    <Countdown endsAt={round.revealEndsAt} label="Reveal closes" size="sm" />
                  )}
                </div>
                <p className="font-display text-2xl font-extrabold leading-snug text-ink">
                  {question.question}
                </p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {question.options.map((option, index) => {
                    const correct = question.correctOption === index;
                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-3 rounded border px-4 py-3 text-sm ${
                          correct
                            ? 'border-emerald-300 bg-emerald-50 font-bold text-emerald-900'
                            : 'border-line text-ink'
                        }`}
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-extrabold text-brand-800">
                          {letters[index] ?? index + 1}
                        </span>
                        {option}
                        {correct && <CheckCircle2 className="ml-auto" size={16} />}
                      </div>
                    );
                  })}
                </div>
                {question.explanation && (
                  <p className="rounded bg-cream px-4 py-3 text-sm text-muted">
                    <span className="font-bold text-ink">Explanation:</span> {question.explanation}
                  </p>
                )}
              </>
            )}
          </div>
        </Card>
      )}

      {isSelfPaced && (
        <Card>
          <CardHead
            title="Self-paced championship"
            sub="Pupils advance on their own. Use this table to monitor progress and live scores."
          />
          <div className="p-5">
            <p className="text-sm text-muted">
              This mode has no host-driven questions. Start the session to open official attempts,
              then watch the progress table below.
            </p>
          </div>
        </Card>
      )}

      <Card>
        <CardHead
          title="Contestants"
          sub={`${state.participants?.length ?? 0} registered · selected answer shown only after reveal`}
        />
        <TableWrap>
          <thead>
            <tr>
              <Th>Contestant</Th>
              <Th>Status</Th>
              <Th>Answer</Th>
              <Th>Score</Th>
              <Th>Correct</Th>
              {state.competition.gameplayMode === 'HOT_SEAT' && <Th>Hot seat</Th>}
            </tr>
          </thead>
          <tbody>
            {(state.participants ?? []).length === 0 && (
              <tr>
                <Td className="text-muted" >No pupils have joined yet.</Td>
              </tr>
            )}
            {(state.participants ?? []).map((participant) => {
              const answer = participant.answer;
              const isSpotlight = session.activeParticipantId === participant.id;
              return (
                <tr key={participant.id} className={isSpotlight ? 'bg-amber-50' : undefined}>
                  <Td>
                    <span className="font-bold text-ink">{participant.name}</span>
                    {isSpotlight && (
                      <span className="ml-2 rounded bg-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-900">
                        Hot seat
                      </span>
                    )}
                  </Td>
                  <Td>{participant.status}</Td>
                  <Td>
                    {answer ? (
                      <span className="inline-flex items-center gap-1.5">
                        {letters[answer.optionIndex] ?? answer.optionIndex + 1}
                        {revealDone &&
                          (answer.isCorrect ? (
                            <CheckCircle2 size={15} className="text-emerald-600" />
                          ) : (
                            <XCircle size={15} className="text-rose-600" />
                          ))}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </Td>
                  <Td className="font-extrabold">{participant.score}</Td>
                  <Td>
                    {participant.correctAnswers}/{participant.totalAnswers}
                  </Td>
                  {state.competition.gameplayMode === 'HOT_SEAT' && (
                    <Td>
                      <button
                        type="button"
                        onClick={() => spotlight(participant.id)}
                        disabled={isSpotlight || ended}
                        className="rounded border border-line px-2 py-1 text-xs font-bold text-brand-700 hover:bg-brand-50 disabled:opacity-40"
                      >
                        {isSpotlight ? 'On seat' : 'Put on seat'}
                      </button>
                    </Td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </TableWrap>
      </Card>

      {(state.leaderboard?.length ?? 0) > 0 && (
        <Card>
          <CardHead title="Live leaderboard" sub="Score, then correct answers" />
          <div className="divide-y divide-line">
            {(state.leaderboard ?? []).map((row, index) => (
              <div key={row.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-900 text-xs font-extrabold text-white">
                  {index + 1}
                </span>
                <span className="font-bold text-ink">{row.name}</span>
                <span className="ml-auto font-display text-lg font-extrabold text-brand-700">{row.score}</span>
                <span className="text-xs text-muted">
                  {row.correctAnswers}/{row.totalAnswers}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

/** ── Page ─────────────────────────────────────────────────────────────────── */
export const AdminUncleTeepediaDetailPage = () => {
  const { id = '' } = useParams();
  const toast = useToast();
  const competition = useResource<UncleTeepediaCompetitionItem>(
    id ? `/uncleteepedia/competitions/${id}` : null,
  );
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [watchOpen, setWatchOpen] = useState(false);

  const sessions = useMemo(() => competition.data?.sessions ?? [], [competition.data]);
  useEffect(() => {
    if (!sessions.length) {
      setSessionId(null);
      return;
    }
    setSessionId((current) => {
      if (current && sessions.some((session) => session.id === current)) return current;
      return (
        sessions.find((session) => session.status === 'LIVE' || session.status === 'PAUSED')?.id ??
        sessions[0].id
      );
    });
  }, [sessions]);

  const createSession = async () => {
    if (!competition.data) return;
    if ((competition.data.questions ?? []).length === 0) {
      toast.error('Add at least one question before opening a session.');
      return;
    }
    setCreating(true);
    try {
      const response = await apiPost<{ id: string }>(
        `/uncleteepedia/competitions/${competition.data.id}/sessions`,
        {},
      );
      toast.success('Session created. Press Start live when the pupils are ready.');
      await competition.reload();
      setSessionId(response.data.id);
    } catch (error: any) {
      toast.error(error?.message ?? 'Could not create session');
    } finally {
      setCreating(false);
    }
  };

  if (competition.loading) return <LoadingSkeleton rows={5} />;
  if (competition.error) return <ErrorState message={competition.error} onRetry={competition.reload} />;
  if (!competition.data) return <EmptyState message="Competition not found." />;
  const data = competition.data;
  const watchUrl = sessionId ? `${window.location.origin}/uncleteepedia/watch/${sessionId}` : '';

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="UncleTeepedia control"
        title={data.title}
        text={`${formatLabel(data.format)} · ${modeLabel(data.gameplayMode)} · ${data.eligibilityLevel} eligibility`}
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(data.joinCode);
                toast.success('Join code copied');
              }}
              className="inline-flex items-center gap-2 rounded border border-line px-4 py-2.5 text-sm font-bold text-brand-800 hover:bg-brand-50"
            >
              <Copy size={15} /> {data.joinCode}
            </button>
            {sessionId && (
              <button
                type="button"
                onClick={() => setWatchOpen(true)}
                className="inline-flex items-center gap-2 rounded bg-brand-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
              >
                <Eye size={15} /> Viewers link
              </button>
            )}
            <button
              type="button"
              onClick={createSession}
              disabled={creating}
              className="inline-flex items-center gap-2 rounded bg-brand-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              <Plus size={15} /> {creating ? 'Creating…' : 'New session'}
            </button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Questions', data._count?.questions ?? data.questions?.length ?? 0],
          ['Participants', data._count?.participants ?? 0],
          ['Sessions', data.sessions?.length ?? 0],
          ['Points / correct', data.pointsPerCorrect],
        ].map(([label, value]) => (
          <Card key={label} className="p-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted">{label}</p>
            <p className="mt-2 font-display text-3xl font-extrabold text-brand-700">{value}</p>
          </Card>
        ))}
      </div>

      <Card>
        <CardHead title="Live sessions" sub="Select a session to open its host control room" />
        <div className="divide-y divide-line">
          {sessions.length === 0 && (
            <div className="p-5">
              <EmptyState message="No session yet. Create one after adding questions." />
            </div>
          )}
          {sessions.map((session) => (
            <button
              key={session.id}
              type="button"
              onClick={() => setSessionId(session.id)}
              className={`flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left text-sm hover:bg-brand-50/60 ${
                sessionId === session.id ? 'bg-brand-50' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <Pill tone={statusTone(session.status)}>{session.status}</Pill>
                <span className="font-bold text-ink">
                  {session.label || `Session ${new Date(session.createdAt).toLocaleString()}`}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted">
                <span>{session._count?.attempts ?? 0} attempts</span>
                <span>{session._count?.events ?? 0} events</span>
                <ChevronRight size={16} />
              </div>
            </button>
          ))}
        </div>
      </Card>

      {sessionId && (
        <HostController sessionId={sessionId} onRefreshCompetition={competition.reload} />
      )}

      <QuestionManager competition={data} reload={competition.reload} />

      <Card>
        <CardHead title="Competition settings" sub="Configuration is frozen in each session snapshot when it starts" />
        <div className="grid gap-4 p-5 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Format', formatLabel(data.format)],
            ['Mode', modeLabel(data.gameplayMode)],
            ['Overall duration', `${data.overallDurationSeconds}s`],
            ['Question duration', data.questionDurationSeconds ? `${data.questionDurationSeconds}s` : 'No per-question cap'],
            ['Reveal duration', `${data.revealDurationSeconds ?? 5}s`],
            ['Points / correct', String(data.pointsPerCorrect)],
            ['Wrong penalty', String(data.negativePoints)],
            ['Shuffle questions', data.shuffleQuestions ? 'Yes' : 'No'],
            ['Leaderboard', data.showLeaderboard ? 'Public' : 'Hidden'],
            ['Practice attempts', data.allowPracticeAttempts ? 'Allowed' : 'Off'],
            ['Buzzer', data.buzzEnabled ? 'Enabled' : 'Off'],
            ['Late join', data.allowLateJoin ? 'Allowed' : 'Closed'],
          ].map(([label, value]) => (
            <div key={label} className="rounded border border-line px-3 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted">{label}</p>
              <p className="mt-1 font-semibold text-ink">{value}</p>
            </div>
          ))}
        </div>
      </Card>

      <Modal open={watchOpen} onClose={() => setWatchOpen(false)} title="Public viewers link" size="lg">
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Share this link with parents and visitors. It shows the live question, options and
            answers, but never the correct answer before you reveal it.
          </p>
          <div className="flex items-center gap-2 rounded border border-line bg-cream px-3 py-2">
            <code className="min-w-0 flex-1 break-all text-xs text-ink">{watchUrl}</code>
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(watchUrl);
                toast.success('Viewers link copied');
              }}
              className="rounded bg-brand-900 p-2 text-white hover:bg-brand-700"
              aria-label="Copy viewers link"
            >
              <Copy size={14} />
            </button>
          </div>
          <a
            href={watchUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded bg-brand-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
          >
            <ExternalLink size={15} /> Open viewers page
          </a>
        </div>
      </Modal>
    </div>
  );
};
