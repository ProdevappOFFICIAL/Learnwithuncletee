import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createAiSession,
  deleteAiSession,
  getAiSession,
  listAiSessions,
  renameAiSession,
  streamAgentTurn,
  type AiChatMessage,
  type AiChatSessionSummary,
  type AiStreamEvent,
  type AiToolCall,
} from '@/lib/aiChat';

const sessionKey = (userId: string) => `lwu_ai_session_${userId}`;
const draftKey = (userId: string, sessionId: string) => `lwu_ai_draft_${userId}_${sessionId || 'new'}`;

const now = () => new Date().toISOString();

const read = (key: string) => {
  try {
    return localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
};

const write = (key: string, value: string) => {
  try {
    if (value) localStorage.setItem(key, value);
    else localStorage.removeItem(key);
  } catch {
    /* private mode */
  }
};

const blankAssistant = (sessionId: string, id: string): AiChatMessage => ({
  id,
  sessionId,
  role: 'assistant',
  content: '',
  parts: { version: 1, steps: [] },
  status: 'streaming',
  model: null,
  usage: null,
  error: null,
  createdAt: now(),
});

export function useAiChat(userId: string | undefined, enabled: boolean) {
  const [sessions, setSessions] = useState<AiChatSessionSummary[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState('');
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [loadingSession, setLoadingSession] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [draft, setDraftState] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const streamErrorRef = useRef<string | null>(null);
  const activeIdRef = useRef('');
  const streamingRef = useRef(false);

  useEffect(() => {
    activeIdRef.current = activeId;
  }, [activeId]);
  useEffect(() => {
    streamingRef.current = streaming;
  }, [streaming]);

  const refreshSessions = useCallback(async () => {
    if (!enabled || !userId) return;
    setSessionsLoading(true);
    setSessionsError(null);
    try {
      const rows = await listAiSessions();
      setSessions(rows);
    } catch (error: any) {
      setSessionsError(error?.message ?? 'Could not load chats');
    } finally {
      setSessionsLoading(false);
    }
  }, [enabled, userId]);

  const openSession = useCallback(
    async (id: string) => {
      if (!id || !enabled) return;
      abortRef.current?.abort();
      setActiveId(id);
      activeIdRef.current = id;
      write(sessionKey(userId ?? ''), id);
      setLoadingSession(true);
      setStreamError(null);
      streamErrorRef.current = null;
      try {
        const detail = await getAiSession(id);
        setMessages(detail.messages);
        setSessions((previous) =>
          previous.map((session) =>
            session.id === id ? { ...session, title: detail.title } : session,
          ),
        );
      } catch (error: any) {
        setStreamError(error?.message ?? 'Could not open this chat');
        setMessages([]);
      } finally {
        setLoadingSession(false);
      }
    },
    [enabled, userId],
  );

  const newChat = useCallback(() => {
    abortRef.current?.abort();
    setActiveId('');
    activeIdRef.current = '';
    write(sessionKey(userId ?? ''), '');
    setMessages([]);
    setStreamError(null);
    streamErrorRef.current = null;
    setDraftState('');
  }, [userId]);

  const setDraft = useCallback(
    (value: string) => {
      setDraftState(value);
      write(draftKey(userId ?? '', activeIdRef.current), value);
    },
    [userId],
  );

  // Restore the last session + draft when the drawer mounts or the user changes.
  useEffect(() => {
    if (!enabled || !userId) return;
    let cancelled = false;
    setSessions([]);
    setMessages([]);
    setActiveId('');
    setStreamError(null);
    const stored = read(sessionKey(userId));
    void refreshSessions().then(() => {
      if (cancelled) return;
      if (stored) void openSession(stored);
    });
    return () => {
      cancelled = true;
      abortRef.current?.abort();
    };
  }, [enabled, userId, refreshSessions, openSession]);

  // Drafts are per session so switching chats never loses typing.
  useEffect(() => {
    if (!enabled || !userId) return;
    setDraftState(read(draftKey(userId, activeId)));
  }, [enabled, userId, activeId]);

  const patchAssistant = useCallback(
    (id: string, patch: (message: AiChatMessage) => AiChatMessage) => {
      setMessages((previous) => previous.map((message) => (message.id === id ? patch(message) : message)));
    },
    [],
  );

  const handleEvent = useCallback(
    (event: AiStreamEvent, assistantId: string) => {
      if (event.type === 'session') {
        const session = event.session ?? (event as any);
        if (!session?.id) return;
        if (!activeIdRef.current && session.id) {
          setActiveId(session.id);
          activeIdRef.current = session.id;
          write(sessionKey(userId ?? ''), session.id);
        }
        setSessions((previous) =>
          previous.map((item) =>
            item.id === session.id ? { ...item, title: session.title ?? item.title } : item,
          ),
        );
        return;
      }

      if (event.type === 'step-start') {
        patchAssistant(assistantId, (message) => ({
          ...message,
          parts: {
            version: 1,
            ...(message.parts ?? {}),
            steps: [
              ...(message.parts?.steps ?? []),
              { index: event.index, status: 'running', startedAt: event.at, toolCalls: [] },
            ],
          },
        }));
        return;
      }

      if (event.type === 'tool-call') {
        patchAssistant(assistantId, (message) => {
          const steps = [...(message.parts?.steps ?? [])];
          if (!steps.length) {
            steps.push({ index: 0, status: 'running', startedAt: Date.now(), toolCalls: [] });
          }
          const current = { ...steps[steps.length - 1] };
          const call: AiToolCall = {
            toolCallId: event.toolCallId,
            toolName: event.toolName,
            input: event.input,
            startedAt: Date.now(),
          };
          current.toolCalls = [...current.toolCalls, call];
          steps[steps.length - 1] = current;
          return { ...message, parts: { version: 1, ...(message.parts ?? {}), steps } };
        });
        return;
      }

      if (event.type === 'tool-result') {
        patchAssistant(assistantId, (message) => {
          const steps = (message.parts?.steps ?? []).map((step) => ({
            ...step,
            toolCalls: step.toolCalls.map((call) =>
              call.toolCallId === event.toolCallId
                ? {
                    ...call,
                    output: event.output,
                    isError: event.isError,
                    durationMs: event.durationMs,
                  }
                : call,
            ),
          }));
          return { ...message, parts: { version: 1, ...(message.parts ?? {}), steps } };
        });
        return;
      }

      if (event.type === 'text-delta') {
        patchAssistant(assistantId, (message) => ({ ...message, content: message.content + event.text }));
        return;
      }

      if (event.type === 'reasoning') {
        patchAssistant(assistantId, (message) => ({
          ...message,
          parts: {
            version: 1,
            steps: message.parts?.steps ?? [],
            reasoning: `${message.parts?.reasoning ?? ''}${event.text}`,
          },
        }));
        return;
      }

      if (event.type === 'step-finish') {
        patchAssistant(assistantId, (message) => ({
          ...message,
          parts: {
            version: 1,
            ...(message.parts ?? {}),
            steps: (message.parts?.steps ?? []).map((step) =>
              step.index === event.index ? { ...step, status: event.status, endedAt: Date.now() } : step,
            ),
          },
        }));
        return;
      }

      if (event.type === 'error') {
        streamErrorRef.current = event.message;
        setStreamError(event.message);
        patchAssistant(assistantId, (message) => ({ ...message, error: event.message }));
        return;
      }

      if (event.type === 'done') {
        patchAssistant(assistantId, (message) => ({
          ...message,
          id: event.messageId,
          status: streamErrorRef.current ? 'error' : 'complete',
          usage: event.usage ?? message.usage,
          parts: {
            version: 1,
            ...(message.parts ?? {}),
            steps: (message.parts?.steps ?? []).map((step) =>
              step.status === 'running' ? { ...step, status: 'done', endedAt: Date.now() } : step,
            ),
          },
        }));
      }
    },
    [patchAssistant, userId],
  );

  const runTurn = useCallback(
    async (options: { message?: string; regenerate?: boolean }) => {
      if (!enabled || streamingRef.current) return;
      const text = String(options.message ?? '').trim();
      if (!options.regenerate && !text) return;
      setStreamError(null);
      streamErrorRef.current = null;

      let sessionId = activeIdRef.current;
      if (!sessionId) {
        try {
          const created = await createAiSession(text.slice(0, 64));
          sessionId = created.id;
          setActiveId(sessionId);
          activeIdRef.current = sessionId;
          write(sessionKey(userId ?? ''), sessionId);
          setSessions((previous) => [
            {
              id: created.id,
              title: created.title,
              createdAt: created.createdAt,
              updatedAt: created.updatedAt,
              lastMessageAt: created.lastMessageAt,
              messageCount: 1,
              preview: text,
            },
            ...previous,
          ]);
        } catch (error: any) {
          setStreamError(error?.message ?? 'Could not start a chat');
          return;
        }
      }

      if (options.regenerate) {
        setMessages((previous) => {
          const lastUserIndex = [...previous].reverse().findIndex((message) => message.role === 'user');
          if (lastUserIndex === -1) return previous;
          return previous.slice(0, previous.length - lastUserIndex);
        });
      } else {
        setMessages((previous) => [
          ...previous,
          {
            id: `user-${Date.now()}`,
            sessionId,
            role: 'user',
            content: text,
            parts: null,
            status: 'complete',
            model: null,
            usage: null,
            error: null,
            createdAt: now(),
          },
        ]);
      }

      const assistantId = `assistant-${Date.now()}`;
      setMessages((previous) => [...previous, blankAssistant(sessionId, assistantId)]);
      setStreaming(true);
      streamingRef.current = true;
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        await streamAgentTurn({
          sessionId,
          message: text,
          regenerate: Boolean(options.regenerate),
          signal: controller.signal,
          onEvent: (event) => handleEvent(event, assistantId),
        });
      } catch (error: any) {
        if (error?.name === 'AbortError') {
          patchAssistant(assistantId, (message) => ({ ...message, status: 'aborted' }));
        } else {
          const message = error?.message ?? 'The AI request failed';
          streamErrorRef.current = message;
          setStreamError(message);
          patchAssistant(assistantId, (assistant) => ({
            ...assistant,
            status: 'error',
            error: message,
          }));
        }
      } finally {
        setStreaming(false);
        streamingRef.current = false;
        abortRef.current = null;
        write(draftKey(userId ?? '', sessionId), '');
        setDraftState('');
        void refreshSessions();
      }
    },
    [enabled, userId, handleEvent, patchAssistant, refreshSessions],
  );

  const send = useCallback(
    async (message: string) => {
      await runTurn({ message });
    },
    [runTurn],
  );

  const regenerate = useCallback(async () => {
    await runTurn({ regenerate: true });
  }, [runTurn]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const rename = useCallback(
    async (id: string, title: string) => {
      const clean = title.trim();
      if (!clean) return;
      setSessions((previous) => previous.map((session) => (session.id === id ? { ...session, title: clean } : session)));
      try {
        await renameAiSession(id, clean);
      } catch (error: any) {
        setStreamError(error?.message ?? 'Could not rename chat');
        void refreshSessions();
      }
    },
    [refreshSessions],
  );

  const remove = useCallback(
    async (id: string) => {
      try {
        await deleteAiSession(id);
        setSessions((previous) => previous.filter((session) => session.id !== id));
        if (activeIdRef.current === id) newChat();
      } catch (error: any) {
        setStreamError(error?.message ?? 'Could not delete chat');
      }
    },
    [newChat],
  );

  return {
    sessions,
    sessionsLoading,
    sessionsError,
    messages,
    activeId,
    loadingSession,
    streaming,
    streamError,
    draft,
    setDraft,
    send,
    stop,
    regenerate,
    newChat,
    openSession,
    rename,
    remove,
    refreshSessions,
  };
}
