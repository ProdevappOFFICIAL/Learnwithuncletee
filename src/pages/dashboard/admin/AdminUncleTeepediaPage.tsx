import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardHead,
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  Modal,
  PageHeader,
  Pill,
} from '@/components/dashboard/DashboardUI';
import { apiGet } from '@/lib/api';
import {
  useCreateCompetition,
  useDeleteCompetition,
  usePrefetchCompetition,
  useUncleTeepediaCompetitions,
} from '@/hooks/useUncleTeepediaQueries';
import { ROUTES } from '@/routes/paths';
import type { ClassItem } from '@/data/dashboard';
import {
  formatLabel,
  modeLabel,
  statusTone,
  type UncleTeepediaCompetitionItem,
  type UncleTeepediaFormat,
  type UncleTeepediaGameplayMode,
} from '@/data/uncleteepedia';
import { Copy, Gamepad2, Plus, Settings, Trash2, Trophy } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

const emptyForm = {
  title: '',
  description: '',
  format: 'SIXTY_SECONDS' as UncleTeepediaFormat,
  gameplayMode: 'HOT_SEAT' as UncleTeepediaGameplayMode,
  eligibilityLevel: 'ALL',
  overallDurationSeconds: 60,
  questionDurationSeconds: '' as number | '',
  answerGraceSeconds: 2,
  revealDurationSeconds: 5,
  pointsPerCorrect: 10,
  negativePoints: 0,
  skipPenalty: 0,
  maxParticipants: '' as number | '',
  shuffleQuestions: true,
  shuffleOptions: true,
  allowLateJoin: true,
  allowPracticeAttempts: false,
  maxPracticeAttempts: '' as number | '',
  showLeaderboard: true,
  buzzEnabled: false,
  rules: '',
  classIds: [] as string[],
  autoAdvance: true,
  autoAdvanceDelaySeconds: 2,
};

export const AdminUncleTeepediaPage = () => {
  const list = useUncleTeepediaCompetitions();
  const classes = useQuery({
    queryKey: ['uncleteepedia', 'class-options'],
    queryFn: async () => (await apiGet<ClassItem[]>('/classes', { limit: 200 })).data,
    staleTime: 30 * 60_000,
    gcTime: 60 * 60_000,
  });
  const createCompetition = useCreateCompetition();
  const deleteCompetition = useDeleteCompetition();
  const prefetchCompetition = usePrefetchCompetition();
  const navigate = useNavigate();
  const toast = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyForm });
  const busy = createCompetition.isPending;

  const competitions = useMemo(() => list.data ?? [], [list.data]);
  const stats = useMemo(
    () => ({
      total: competitions.length,
      live: competitions.filter((item) => item.status === 'LIVE' || item.status === 'PAUSED').length,
      questions: competitions.reduce((sum, item) => sum + (item._count?.questions ?? 0), 0),
      players: competitions.reduce((sum, item) => sum + (item._count?.participants ?? 0), 0),
    }),
    [competitions],
  );

  useEffect(() => {
    if (form.format === 'SIXTY_SECONDS' && form.gameplayMode === 'SELF_PACED') {
      setForm((current) => ({ ...current, gameplayMode: 'HOT_SEAT' }));
    }
    if (form.format === 'MULTIPLE_CHOICE' && form.gameplayMode !== 'SELF_PACED') {
      setForm((current) => ({ ...current, gameplayMode: 'SELF_PACED' }));
    }
  }, [form.format, form.gameplayMode]);

  const set = <K extends keyof typeof form,>(key: K, value: (typeof form)[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const toggleClass = (classId: string) =>
    set(
      'classIds',
      form.classIds.includes(classId)
        ? form.classIds.filter((id) => id !== classId)
        : [...form.classIds, classId],
    );

  const create = async () => {
    if (!form.title.trim()) {
      toast.error('Give the competition a title first.');
      return;
    }
    try {
      const created = await createCompetition.mutateAsync({
        ...form,
        questionDurationSeconds: form.questionDurationSeconds || null,
        maxParticipants: form.maxParticipants || null,
        maxPracticeAttempts: form.maxPracticeAttempts || null,
        settings: {
          autoAdvance: form.autoAdvance,
          autoAdvanceDelaySeconds: form.autoAdvanceDelaySeconds,
        },
      });
      toast.success('Competition created. Add questions next.');
      setDialogOpen(false);
      setForm({ ...emptyForm });
      navigate(`${ROUTES.adminUncleTeepedia}/${created.id}`);
    } catch (error: any) {
      toast.error(error?.message ?? 'Could not create competition');
    }
  };

  const remove = async (competition: UncleTeepediaCompetitionItem) => {
    if (!window.confirm(`Delete "${competition.title}"? This cannot be undone.`)) return;
    try {
      await deleteCompetition.mutateAsync(competition.id);
      toast.success('Competition deleted');
    } catch (error: any) {
      toast.error(error?.message ?? 'Could not delete competition');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Live school quiz"
        title="UncleTeepedia"
        text="Create 60 Seconds of Fame shows and multiple-choice championships, then open a live control room for the host."
        actions={
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            className="inline-flex items-center gap-2 rounded bg-brand-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700"
          >
            <Plus size={16} /> New competition
          </button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ['Competitions', stats.total, Trophy],
          ['Live now', stats.live, Gamepad2],
          ['Questions', stats.questions, Settings],
          ['Registered pupils', stats.players, Trophy],
        ].map(([label, value, Icon]: any) => (
          <Card key={label} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted">{label}</p>
                <p className="mt-2 font-display text-3xl font-extrabold text-brand-700">{value}</p>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-700">
                <Icon size={18} />
              </span>
            </div>
          </Card>
        ))}
      </div>

      {list.isPending && !list.data && <LoadingSkeleton rows={4} />}
      {list.error && <ErrorState message={list.error.message} onRetry={() => list.refetch()} />}
      {!list.isPending && !list.error && competitions.length === 0 && (
        <EmptyState message="No competitions yet. Create one to get started." />
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {competitions.map((competition) => (
          <div
            key={competition.id}
            onMouseEnter={() => prefetchCompetition(competition.id)}
            className="flex"
          >
          <Card className="flex w-full flex-col">
            <CardHead
              title={competition.title}
              sub={`${formatLabel(competition.format)} · ${modeLabel(competition.gameplayMode)}`}
              link={{ to: `${ROUTES.adminUncleTeepedia}/${competition.id}`, label: 'Manage' }}
            />
            <div className="flex flex-1 flex-col gap-4 p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Pill tone={statusTone(competition.status)}>{competition.status}</Pill>
                <Pill tone="sky">{competition.eligibilityLevel}</Pill>
                {competition.buzzEnabled && <Pill tone="amber">Buzzer</Pill>}
              </div>
              {competition.description && (
                <p className="line-clamp-2 text-sm leading-relaxed text-muted">{competition.description}</p>
              )}
              <div className="grid grid-cols-3 gap-3 border-y border-line py-3 text-sm">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Questions</p>
                  <p className="mt-1 font-extrabold text-ink">{competition._count?.questions ?? 0}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Pupils</p>
                  <p className="mt-1 font-extrabold text-ink">{competition._count?.participants ?? 0}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted">Sessions</p>
                  <p className="mt-1 font-extrabold text-ink">{competition._count?.sessions ?? 0}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="rounded border border-dashed border-brand-300 bg-brand-50 px-3 py-1.5 font-mono text-sm font-extrabold tracking-wider text-brand-800">
                    {competition.joinCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard?.writeText(competition.joinCode);
                      toast.success('Join code copied');
                    }}
                    className="rounded border border-line p-2 text-brand-700 hover:bg-brand-50"
                    aria-label="Copy join code"
                  >
                    <Copy size={14} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`${ROUTES.adminUncleTeepedia}/${competition.id}`}
                    className="inline-flex items-center gap-2 rounded bg-brand-900 px-3 py-2 text-xs font-bold text-white hover:bg-brand-700"
                  >
                    <Gamepad2 size={14} /> Control room
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(competition)}
                    className="rounded border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
                    aria-label="Delete competition"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          </Card>
          </div>
        ))}
      </div>

      <Modal open={dialogOpen} onClose={() => setDialogOpen(false)} title="Create UncleTeepedia competition" size="xl">
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-bold text-ink">Title</span>
              <input
                value={form.title}
                onChange={(event) => set('title', event.target.value)}
                placeholder="e.g. Friday 60 Seconds of Fame"
                className="mt-1 w-full rounded border border-line px-3 py-2.5 outline-none focus:border-brand-500"
              />
            </label>
            <label className="block text-sm">
              <span className="font-bold text-ink">Format</span>
              <select
                value={form.format}
                onChange={(event) => set('format', event.target.value as UncleTeepediaFormat)}
                className="mt-1 w-full rounded border border-line px-3 py-2.5 outline-none focus:border-brand-500"
              >
                <option value="SIXTY_SECONDS">60 Seconds of Fame</option>
                <option value="MULTIPLE_CHOICE">Multiple Choice Championship</option>
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-bold text-ink">Gameplay mode</span>
              <select
                value={form.gameplayMode}
                onChange={(event) => set('gameplayMode', event.target.value as UncleTeepediaGameplayMode)}
                className="mt-1 w-full rounded border border-line px-3 py-2.5 outline-none focus:border-brand-500"
              >
                {form.format === 'SIXTY_SECONDS' ? (
                  <>
                    <option value="HOT_SEAT">Individual Hot Seat</option>
                    <option value="SHARED_LIVE">Shared Live Challenge</option>
                  </>
                ) : (
                  <option value="SELF_PACED">Self-paced MCQ</option>
                )}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-bold text-ink">Eligibility</span>
              <select
                value={form.eligibilityLevel}
                onChange={(event) => set('eligibilityLevel', event.target.value)}
                className="mt-1 w-full rounded border border-line px-3 py-2.5 outline-none focus:border-brand-500"
              >
                <option value="ALL">All pupils</option>
                <option value="JUNIOR">Junior only</option>
                <option value="SENIOR">Senior only</option>
              </select>
            </label>
          </div>

          <label className="block text-sm">
            <span className="font-bold text-ink">Description</span>
            <textarea
              value={form.description}
              onChange={(event) => set('description', event.target.value)}
              rows={2}
              className="mt-1 w-full rounded border border-line px-3 py-2.5 outline-none focus:border-brand-500"
              placeholder="What pupils and viewers should know about this show"
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block text-sm">
              <span className="font-bold text-ink">Overall duration (s)</span>
              <input
                type="number"
                min={10}
                value={form.overallDurationSeconds}
                onChange={(event) => set('overallDurationSeconds', Number(event.target.value))}
                className="mt-1 w-full rounded border border-line px-3 py-2.5"
              />
            </label>
            <label className="block text-sm">
              <span className="font-bold text-ink">Question timer (s)</span>
              <input
                type="number"
                min={5}
                value={form.questionDurationSeconds}
                onChange={(event) =>
                  set('questionDurationSeconds', event.target.value === '' ? '' : Number(event.target.value))
                }
                placeholder="Optional"
                className="mt-1 w-full rounded border border-line px-3 py-2.5"
              />
            </label>
            <label className="block text-sm">
              <span className="font-bold text-ink">Reveal duration (s)</span>
              <input
                type="number"
                min={0}
                value={form.revealDurationSeconds}
                onChange={(event) => set('revealDurationSeconds', Number(event.target.value))}
                className="mt-1 w-full rounded border border-line px-3 py-2.5"
              />
            </label>
          </div>

          {form.format === 'SIXTY_SECONDS' && (
            <div className="grid gap-4 rounded border border-brand-200 bg-brand-50/60 p-4 sm:grid-cols-[1fr_180px]">
              <label className="flex cursor-pointer items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={form.autoAdvance}
                  onChange={(event) => set('autoAdvance', event.target.checked)}
                  className="mt-0.5 accent-brand-600"
                />
                <span>
                  <span className="font-bold text-ink">Auto-advance after answers</span>
                  <span className="mt-0.5 block text-xs text-muted">
                    Reveal the answer and move to the next question automatically. Hot Seat moves
                    after the contestant answers; Shared Live waits until everyone has answered.
                  </span>
                </span>
              </label>
              <label className="block text-sm">
                <span className="font-bold text-ink">Auto-advance delay (s)</span>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={form.autoAdvanceDelaySeconds}
                  onChange={(event) => set('autoAdvanceDelaySeconds', Number(event.target.value))}
                  className="mt-1 w-full rounded border border-line bg-white px-3 py-2.5"
                />
              </label>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-4">
            <label className="block text-sm">
              <span className="font-bold text-ink">Points / correct</span>
              <input
                type="number"
                value={form.pointsPerCorrect}
                onChange={(event) => set('pointsPerCorrect', Number(event.target.value))}
                className="mt-1 w-full rounded border border-line px-3 py-2.5"
              />
            </label>
            <label className="block text-sm">
              <span className="font-bold text-ink">Wrong penalty</span>
              <input
                type="number"
                min={0}
                value={form.negativePoints}
                onChange={(event) => set('negativePoints', Number(event.target.value))}
                className="mt-1 w-full rounded border border-line px-3 py-2.5"
              />
            </label>
            <label className="block text-sm">
              <span className="font-bold text-ink">Max pupils</span>
              <input
                type="number"
                min={1}
                value={form.maxParticipants}
                onChange={(event) =>
                  set('maxParticipants', event.target.value === '' ? '' : Number(event.target.value))
                }
                placeholder="Unlimited"
                className="mt-1 w-full rounded border border-line px-3 py-2.5"
              />
            </label>
            <label className="block text-sm">
              <span className="font-bold text-ink">Practice attempts</span>
              <input
                type="number"
                min={1}
                value={form.maxPracticeAttempts}
                onChange={(event) =>
                  set('maxPracticeAttempts', event.target.value === '' ? '' : Number(event.target.value))
                }
                placeholder="Off"
                className="mt-1 w-full rounded border border-line px-3 py-2.5"
              />
            </label>
          </div>

          <fieldset>
            <legend className="text-sm font-bold text-ink">Optional class restriction</legend>
            <p className="mt-1 text-xs text-muted">
              Leave every class unchecked to allow all classes that match the eligibility level.
            </p>
            <div className="mt-3 grid max-h-44 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
              {(classes.data ?? []).map((classItem) => (
                <label
                  key={classItem.id}
                  className="flex cursor-pointer items-center gap-2 rounded border border-line px-3 py-2 text-sm hover:border-brand-400"
                >
                  <input
                    type="checkbox"
                    checked={form.classIds.includes(classItem.id)}
                    onChange={() => toggleClass(classItem.id)}
                    className="accent-brand-600"
                  />
                  {classItem.name}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ['shuffleQuestions', 'Shuffle questions'],
              ['shuffleOptions', 'Shuffle options'],
              ['allowLateJoin', 'Allow late joining'],
              ['allowPracticeAttempts', 'Allow practice attempts'],
              ['showLeaderboard', 'Show public leaderboard'],
              ['buzzEnabled', 'Enable buzzer'],
            ].map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-center gap-2 rounded border border-line px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={Boolean((form as any)[key])}
                  onChange={(event) => set(key as any, event.target.checked as any)}
                  className="accent-brand-600"
                />
                {label}
              </label>
            ))}
          </div>

          <label className="block text-sm">
            <span className="font-bold text-ink">Rules shown to pupils</span>
            <textarea
              value={form.rules}
              onChange={(event) => set('rules', event.target.value)}
              rows={3}
              className="mt-1 w-full rounded border border-line px-3 py-2.5"
              placeholder="e.g. No phones. Answers lock after submission."
            />
          </label>

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button
              type="button"
              onClick={() => setDialogOpen(false)}
              className="rounded border border-line px-4 py-2.5 text-sm font-bold text-brand-800 hover:bg-brand-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={create}
              className="rounded bg-brand-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {busy ? 'Creating…' : 'Create competition'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
