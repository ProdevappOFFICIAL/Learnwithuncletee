import { apiDelete, apiFetch, apiGet, apiPatch, apiPost } from './api';

export interface AiToolCall {
  toolCallId: string;
  toolName: string;
  input?: unknown;
  output?: unknown;
  isError?: boolean;
  durationMs?: number;
  startedAt?: number;
}

export interface AiAttachment {
  id: string;
  url: string;
  name?: string;
  mimeType?: string;
  size?: number;
}

export interface AiStep {
  index: number;
  status: 'running' | 'done' | 'error';
  startedAt: number;
  endedAt?: number;
  toolCalls: AiToolCall[];
}

export interface AiMessageParts {
  version: 1;
  steps: AiStep[];
  reasoning?: string;
  attachments?: AiAttachment[];
}

export interface AiChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  parts: AiMessageParts | null;
  status: 'streaming' | 'complete' | 'error' | 'aborted';
  model: string | null;
  usage: unknown;
  error: string | null;
  createdAt: string;
}

export interface AiChatSessionSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  messageCount: number;
  preview: string;
}

export interface AiSessionDetail {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
  messages: AiChatMessage[];
}

export type AiStreamEvent =
  | { type: 'session'; session: { id: string; title: string } }
  | { type: 'step-start'; index: number; at: number }
  | { type: 'tool-call'; toolCallId: string; toolName: string; input?: unknown }
  | {
      type: 'tool-result';
      toolCallId: string;
      toolName: string;
      output?: unknown;
      isError?: boolean;
      durationMs?: number;
    }
  | { type: 'text-delta'; text: string }
  | { type: 'reasoning'; text: string }
  | { type: 'step-finish'; index: number; status: 'done' | 'error' }
  | { type: 'done'; messageId: string; finishReason?: string; usage?: unknown; elapsedMs: number }
  | { type: 'error'; message: string };

export const AI_SESSIONS_KEY = ['ai-chat-sessions'] as const;

export const listAiSessions = async () =>
  (await apiGet<AiChatSessionSummary[]>('/ai/agent/sessions')).data;

export const createAiSession = async (title?: string) =>
  (await apiPost<AiSessionDetail>('/ai/agent/sessions', title ? { title } : {})).data;

export const getAiSession = async (id: string) =>
  (await apiGet<AiSessionDetail>(`/ai/agent/sessions/${encodeURIComponent(id)}`)).data;

export const renameAiSession = async (id: string, title: string) =>
  (await apiPatch<{ id: string; title: string }>(`/ai/agent/sessions/${encodeURIComponent(id)}`, { title })).data;

export const deleteAiSession = async (id: string) =>
  (await apiDelete<{ id: string; deleted: boolean }>(`/ai/agent/sessions/${encodeURIComponent(id)}`)).data;

export const getAiToolCatalog = async () =>
  (
    await apiGet<{
      model: string;
      groups: Array<{ label: string; tools: Array<{ name: string; description: string; permission: string }> }>;
    }>('/ai/agent/tools')
  ).data;

/**
 * Send a turn and consume the server's SSE stream. Resolves when the stream
 * ends; rejects on transport/HTTP errors (an in-stream `error` event does not
 * reject, it is delivered to onEvent so the UI can keep the partial message).
 */
export async function streamAgentTurn(options: {
  sessionId?: string;
  message?: string;
  attachments?: AiAttachment[];
  regenerate?: boolean;
  signal?: AbortSignal;
  onEvent: (event: AiStreamEvent) => void;
}): Promise<void> {
  const res = await apiFetch('/ai/agent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({
      sessionId: options.sessionId,
      message: options.message,
      attachments: options.attachments,
      regenerate: options.regenerate,
    }),
    signal: options.signal,
  });

  if (!res.body) throw new Error('Streaming is not supported by this browser.');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const dispatch = (frame: string) => {
    const lines = frame.split('\n');
    let event = 'message';
    const data: string[] = [];
    for (const line of lines) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) data.push(line.slice(5).trimStart());
    }
    if (!data.length) return;
    const raw = data.join('\n');
    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return;
    }
    options.onEvent({ ...parsed, type: event } as AiStreamEvent);
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      if (frame.trim()) dispatch(frame);
      boundary = buffer.indexOf('\n\n');
    }
  }
  if (buffer.trim()) dispatch(buffer);
}
