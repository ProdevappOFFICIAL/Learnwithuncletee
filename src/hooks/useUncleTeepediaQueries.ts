import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { apiDelete, apiGet, apiPost, apiPut } from '@/lib/api';
import type {
  UncleTeepediaCompetitionItem,
  UncleTeepediaLiveState,
  UncleTeepediaMineItem,
  UncleTeepediaQuestionItem,
  UncleTeepediaSessionItem,
} from '@/data/uncleteepedia';

/** Central query keys so REST mutations and Socket.IO updates share one cache. */
export const utpKeys = {
  competitions: ['uncleteepedia', 'competitions'] as const,
  competition: (id: string) => ['uncleteepedia', 'competition', id] as const,
  mine: ['uncleteepedia', 'mine'] as const,
  host: (sessionId: string) => ['uncleteepedia', 'host', sessionId] as const,
  player: (sessionId: string) => ['uncleteepedia', 'player', sessionId] as const,
};

const LIST_STALE_MS = 5 * 60_000;
const DETAIL_STALE_MS = 5 * 60_000;

const fetchCompetitions = async () =>
  (await apiGet<UncleTeepediaCompetitionItem[]>('/uncleteepedia/competitions')).data;

const fetchCompetition = async (id: string) =>
  (await apiGet<UncleTeepediaCompetitionItem>(`/uncleteepedia/competitions/${id}`)).data;

export const useUncleTeepediaCompetitions = () =>
  useQuery({
    queryKey: utpKeys.competitions,
    queryFn: fetchCompetitions,
    staleTime: LIST_STALE_MS,
    gcTime: 30 * 60_000,
    placeholderData: keepPreviousData,
  });

export const useUncleTeepediaCompetition = (id?: string) =>
  useQuery({
    queryKey: utpKeys.competition(id ?? ''),
    queryFn: () => fetchCompetition(id as string),
    enabled: Boolean(id) && !id?.startsWith('optimistic-'),
    staleTime: DETAIL_STALE_MS,
    gcTime: 30 * 60_000,
  });

export const useUncleTeepediaMine = () =>
  useQuery({
    queryKey: utpKeys.mine,
    queryFn: async () => (await apiGet<UncleTeepediaMineItem[]>('/uncleteepedia/mine')).data,
    staleTime: 30_000,
    gcTime: 30 * 60_000,
    placeholderData: keepPreviousData,
  });

export const useUncleTeepediaHostState = (sessionId: string | null) =>
  useQuery({
    queryKey: utpKeys.host(sessionId ?? ''),
    queryFn: async () =>
      (await apiGet<UncleTeepediaLiveState>(`/uncleteepedia/sessions/${sessionId}/state`)).data,
    enabled: Boolean(sessionId),
    staleTime: 0,
    gcTime: 10 * 60_000,
  });

export const useUncleTeepediaPlayerState = (sessionId: string | null) =>
  useQuery({
    queryKey: utpKeys.player(sessionId ?? ''),
    queryFn: async () =>
      (await apiGet<UncleTeepediaLiveState>(`/uncleteepedia/sessions/${sessionId}/player-state`)).data,
    enabled: Boolean(sessionId),
    staleTime: 0,
    gcTime: 10 * 60_000,
  });

/** Background refresh without blanking cached screens. */
const refresh = (client: QueryClient, queryKey: readonly unknown[]) =>
  void client.invalidateQueries({ queryKey, refetchType: 'active' });

const replaceQuestionList = (
  competition: UncleTeepediaCompetitionItem | undefined,
  questions: UncleTeepediaQuestionItem[],
): UncleTeepediaCompetitionItem | undefined =>
  competition
    ? {
        ...competition,
        questions,
        _count: { ...(competition._count ?? {}), questions: questions.length },
      }
    : competition;

export const usePrefetchCompetition = () => {
  const client = useQueryClient();
  return (id: string) => {
    void client.prefetchQuery({
      queryKey: utpKeys.competition(id),
      queryFn: () => fetchCompetition(id),
      staleTime: DETAIL_STALE_MS,
    });
  };
};

export const usePrefetchPlayerState = () => {
  const client = useQueryClient();
  return (sessionId: string) => {
    void client.prefetchQuery({
      queryKey: utpKeys.player(sessionId),
      queryFn: async () =>
        (await apiGet<UncleTeepediaLiveState>(`/uncleteepedia/sessions/${sessionId}/player-state`))
          .data,
      staleTime: 0,
    });
  };
};

export const useCreateCompetition = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (body: any) =>
      (await apiPost<UncleTeepediaCompetitionItem>('/uncleteepedia/competitions', body)).data,
    onMutate: async (body) => {
      await client.cancelQueries({ queryKey: utpKeys.competitions });
      const previous = client.getQueryData<UncleTeepediaCompetitionItem[]>(utpKeys.competitions);
      const optimisticId = `optimistic-${Date.now()}`;
      const optimistic: UncleTeepediaCompetitionItem = {
        id: optimisticId,
        title: body.title || 'New competition',
        description: body.description ?? null,
        format: body.format,
        gameplayMode: body.gameplayMode,
        status: 'DRAFT',
        joinCode: 'UTP-······',
        eligibilityLevel: body.eligibilityLevel ?? 'ALL',
        overallDurationSeconds: body.overallDurationSeconds ?? 60,
        questionDurationSeconds: body.questionDurationSeconds ?? null,
        revealDurationSeconds: body.revealDurationSeconds ?? 5,
        pointsPerCorrect: body.pointsPerCorrect ?? 10,
        negativePoints: body.negativePoints ?? 0,
        questions: [],
        sessions: [],
        _count: { questions: 0, participants: 0, sessions: 0 },
      };
      client.setQueryData<UncleTeepediaCompetitionItem[]>(utpKeys.competitions, [
        optimistic,
        ...(previous ?? []),
      ]);
      return { previous, optimisticId };
    },
    onError: (_error, _body, context) => {
      if (context?.previous) client.setQueryData(utpKeys.competitions, context.previous);
    },
    onSuccess: (created, _body, context) => {
      client.setQueryData<UncleTeepediaCompetitionItem[]>(utpKeys.competitions, (current) =>
        (current ?? []).map((item) => (item.id === context?.optimisticId ? created : item)),
      );
      client.setQueryData(utpKeys.competition(created.id), created);
      refresh(client, utpKeys.competitions);
    },
  });
};

export const useDeleteCompetition = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => (await apiDelete(`/uncleteepedia/competitions/${id}`)).data,
    onMutate: async (id) => {
      await client.cancelQueries({ queryKey: utpKeys.competitions });
      const previous = client.getQueryData<UncleTeepediaCompetitionItem[]>(utpKeys.competitions);
      client.setQueryData<UncleTeepediaCompetitionItem[]>(utpKeys.competitions, (current) =>
        (current ?? []).filter((item) => item.id !== id),
      );
      client.removeQueries({ queryKey: utpKeys.competition(id) });
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) client.setQueryData(utpKeys.competitions, context.previous);
    },
    onSettled: () => refresh(client, utpKeys.competitions),
  });
};

export const useAddQuestions = (competitionId: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (questions: Array<Partial<UncleTeepediaQuestionItem>>) =>
      (
        await apiPost<UncleTeepediaQuestionItem[]>(
          `/uncleteepedia/competitions/${competitionId}/questions`,
          { questions },
        )
      ).data,
    onMutate: async (questions) => {
      await client.cancelQueries({ queryKey: utpKeys.competition(competitionId) });
      const previous = client.getQueryData<UncleTeepediaCompetitionItem>(
        utpKeys.competition(competitionId),
      );
      const optimistic = (questions ?? []).map((question, index) => ({
        id: `optimistic-question-${Date.now()}-${index}`,
        competitionId,
        question: question.question ?? 'Adding question…',
        options: question.options ?? [],
        correctOption: question.correctOption ?? 0,
        explanation: question.explanation ?? null,
        imageUrl: question.imageUrl ?? null,
        order: (previous?.questions?.length ?? 0) + index,
        points: question.points ?? null,
      })) as UncleTeepediaQuestionItem[];
      client.setQueryData<UncleTeepediaCompetitionItem>(
        utpKeys.competition(competitionId),
        (current) =>
          replaceQuestionList(current, [...(current?.questions ?? []), ...optimistic]),
      );
      return { previous };
    },
    onError: (_error, _questions, context) => {
      if (context?.previous) client.setQueryData(utpKeys.competition(competitionId), context.previous);
    },
    onSuccess: (questions) => {
      client.setQueryData<UncleTeepediaCompetitionItem>(
        utpKeys.competition(competitionId),
        (current) => replaceQuestionList(current, questions),
      );
      refresh(client, utpKeys.competition(competitionId));
      refresh(client, utpKeys.competitions);
    },
  });
};

export const useImportQuestions = (competitionId: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (questionIds: string[]) =>
      (
        await apiPost<UncleTeepediaQuestionItem[]>(
          `/uncleteepedia/competitions/${competitionId}/questions/import`,
          { questionIds },
        )
      ).data,
    onMutate: async (questionIds) => {
      await client.cancelQueries({ queryKey: utpKeys.competition(competitionId) });
      const previous = client.getQueryData<UncleTeepediaCompetitionItem>(
        utpKeys.competition(competitionId),
      );
      const placeholders = questionIds.map((_, index) => ({
        id: `optimistic-import-${Date.now()}-${index}`,
        competitionId,
        question: 'Importing from the question bank…',
        options: [],
        correctOption: 0,
        explanation: null,
        imageUrl: null,
        order: (previous?.questions?.length ?? 0) + index,
      })) as UncleTeepediaQuestionItem[];
      client.setQueryData<UncleTeepediaCompetitionItem>(
        utpKeys.competition(competitionId),
        (current) =>
          replaceQuestionList(current, [...(current?.questions ?? []), ...placeholders]),
      );
      return { previous };
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) client.setQueryData(utpKeys.competition(competitionId), context.previous);
    },
    onSuccess: (questions) => {
      client.setQueryData<UncleTeepediaCompetitionItem>(
        utpKeys.competition(competitionId),
        (current) => replaceQuestionList(current, questions),
      );
      refresh(client, utpKeys.competition(competitionId));
      refresh(client, utpKeys.competitions);
    },
  });
};

export const useUpdateQuestion = (competitionId: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({ questionId, body }: { questionId: string; body: any }) =>
      (
        await apiPut<UncleTeepediaQuestionItem>(
          `/uncleteepedia/competitions/${competitionId}/questions/${questionId}`,
          body,
        )
      ).data,
    onMutate: async ({ questionId, body }) => {
      await client.cancelQueries({ queryKey: utpKeys.competition(competitionId) });
      const previous = client.getQueryData<UncleTeepediaCompetitionItem>(
        utpKeys.competition(competitionId),
      );
      client.setQueryData<UncleTeepediaCompetitionItem>(
        utpKeys.competition(competitionId),
        (current) =>
          current
            ? {
                ...current,
                questions: (current.questions ?? []).map((question) =>
                  question.id === questionId ? { ...question, ...body } : question,
                ),
              }
            : current,
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) client.setQueryData(utpKeys.competition(competitionId), context.previous);
    },
    onSuccess: (question) => {
      client.setQueryData<UncleTeepediaCompetitionItem>(
        utpKeys.competition(competitionId),
        (current) =>
          current
            ? {
                ...current,
                questions: (current.questions ?? []).map((row) =>
                  row.id === question.id ? question : row,
                ),
              }
            : current,
      );
      refresh(client, utpKeys.competition(competitionId));
    },
  });
};

export const useDeleteQuestion = (competitionId: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (questionId: string) =>
      (await apiDelete(`/uncleteepedia/competitions/${competitionId}/questions/${questionId}`)).data,
    onMutate: async (questionId) => {
      await client.cancelQueries({ queryKey: utpKeys.competition(competitionId) });
      const previous = client.getQueryData<UncleTeepediaCompetitionItem>(
        utpKeys.competition(competitionId),
      );
      client.setQueryData<UncleTeepediaCompetitionItem>(
        utpKeys.competition(competitionId),
        (current) =>
          replaceQuestionList(
            current,
            (current?.questions ?? []).filter((question) => question.id !== questionId),
          ),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) client.setQueryData(utpKeys.competition(competitionId), context.previous);
    },
    onSuccess: () => {
      refresh(client, utpKeys.competition(competitionId));
      refresh(client, utpKeys.competitions);
    },
  });
};

export const useReorderQuestions = (competitionId: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (questionIds: string[]) =>
      (
        await apiPost<UncleTeepediaQuestionItem[]>(
          `/uncleteepedia/competitions/${competitionId}/questions/reorder`,
          { questionIds },
        )
      ).data,
    onMutate: async (questionIds) => {
      await client.cancelQueries({ queryKey: utpKeys.competition(competitionId) });
      const previous = client.getQueryData<UncleTeepediaCompetitionItem>(
        utpKeys.competition(competitionId),
      );
      client.setQueryData<UncleTeepediaCompetitionItem>(
        utpKeys.competition(competitionId),
        (current) => {
          if (!current?.questions) return current;
          const byId = new Map(current.questions.map((question) => [question.id, question]));
          return {
            ...current,
            questions: questionIds
              .map((id, order) => {
                const question = byId.get(id);
                return question ? { ...question, order } : null;
              })
              .filter(Boolean) as UncleTeepediaQuestionItem[],
          };
        },
      );
      return { previous };
    },
    onError: (_error, _ids, context) => {
      if (context?.previous) client.setQueryData(utpKeys.competition(competitionId), context.previous);
    },
    onSuccess: (questions) => {
      client.setQueryData<UncleTeepediaCompetitionItem>(
        utpKeys.competition(competitionId),
        (current) => replaceQuestionList(current, questions),
      );
    },
  });
};

export const useCreateSession = (competitionId: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async () =>
      (
        await apiPost<UncleTeepediaSessionItem>(
          `/uncleteepedia/competitions/${competitionId}/sessions`,
          {},
        )
      ).data,
    onMutate: async () => {
      await client.cancelQueries({ queryKey: utpKeys.competition(competitionId) });
      const previous = client.getQueryData<UncleTeepediaCompetitionItem>(
        utpKeys.competition(competitionId),
      );
      const optimistic: UncleTeepediaSessionItem = {
        id: `optimistic-session-${Date.now()}`,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        _count: { attempts: 0, rounds: 0, events: 0 },
      };
      client.setQueryData<UncleTeepediaCompetitionItem>(
        utpKeys.competition(competitionId),
        (current) =>
          current
            ? {
                ...current,
                status: 'SCHEDULED',
                sessions: [optimistic, ...(current.sessions ?? [])],
                _count: { ...(current._count ?? {}), sessions: (current._count?.sessions ?? 0) + 1 },
              }
            : current,
      );
      return { previous, optimisticId: optimistic.id };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) client.setQueryData(utpKeys.competition(competitionId), context.previous);
    },
    onSuccess: (session, _vars, context) => {
      client.setQueryData<UncleTeepediaCompetitionItem>(
        utpKeys.competition(competitionId),
        (current) =>
          current
            ? {
                ...current,
                sessions: (current.sessions ?? []).map((row) =>
                  row.id === context?.optimisticId ? session : row,
                ),
              }
            : current,
      );
      refresh(client, utpKeys.competition(competitionId));
      refresh(client, utpKeys.competitions);
    },
  });
};

export const useJoinCompetition = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) =>
      (
        await apiPost<{
          competition: {
            id: string;
            title: string;
            format: string;
            gameplayMode: string;
            status: string;
            rules?: string | null;
            overallDurationSeconds?: number;
          };
          participant: { id: string; status: string; cachedTotalScore?: number };
          sessionId?: string | null;
        }>('/uncleteepedia/join', { code })
      ).data,
    onSuccess: (result) => {
      const mine = client.getQueryData<UncleTeepediaMineItem[]>(utpKeys.mine);
      if (mine) {
        const existing = mine.some((item) => item.id === result.competition.id);
        if (!existing) {
          client.setQueryData<UncleTeepediaMineItem[]>(utpKeys.mine, [
            {
              id: result.competition.id,
              title: result.competition.title,
              format: result.competition.format as any,
              gameplayMode: result.competition.gameplayMode as any,
              status: result.competition.status as any,
              joinCode: '',
              questionCount: 0,
              sessionId: result.sessionId ?? null,
              participant: {
                id: result.participant.id,
                status: result.participant.status,
                cachedTotalScore: result.participant.cachedTotalScore ?? 0,
              },
            },
            ...mine,
          ]);
        }
      }
      void client.invalidateQueries({ queryKey: utpKeys.mine, refetchType: 'active' });
    },
  });
};

/** Used by host/player Socket.IO handlers to write straight into the cache. */
export const setHostStateCache = (
  client: QueryClient,
  sessionId: string,
  state: UncleTeepediaLiveState,
) => client.setQueryData(utpKeys.host(sessionId), state);

export const setPlayerStateCache = (
  client: QueryClient,
  sessionId: string,
  state: UncleTeepediaLiveState,
) => client.setQueryData(utpKeys.player(sessionId), state);
