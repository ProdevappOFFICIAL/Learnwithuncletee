import { io, type Socket } from 'socket.io-client';
import { API_BASE, tokenStore } from './api';

/** API_BASE ends in /api; Socket.IO lives at the origin root. */
export const SOCKET_BASE = (() => {
  const env = (import.meta as any).env ?? {};
  if (env.VITE_SOCKET_URL) return String(env.VITE_SOCKET_URL).replace(/\/$/, '');
  return API_BASE.replace(/\/api\/?$/, '');
})();

export interface UncleTeepediaSocketEnvelope<T = any> {
  role?: 'host' | 'player' | 'viewer';
  serverNow?: number;
  state?: T;
}

export interface UncleTeepediaSocketOptions<T> {
  sessionId: string | null;
  followParticipantId?: string | null;
  onState: (state: T, role: 'host' | 'player' | 'viewer') => void;
  onError?: (message: string) => void;
  enabled?: boolean;
  /** Public watch pages downgrade even a signed-in contestant to viewer. */
  forceViewer?: boolean;
}

/**
 * One socket per mounted screen. The server decides the role from the bearer
 * token; this client never sends a role. On disconnect Socket.IO reconnects
 * and the join handler replays the authoritative state snapshot.
 */
export const connectUncleTeepedia = <T,>({
  sessionId,
  followParticipantId,
  onState,
  onError,
  enabled = true,
  forceViewer = false,
}: UncleTeepediaSocketOptions<T>) => {
  if (!enabled || !sessionId) return null;
  const token = tokenStore.get();
  const socket: Socket = io(`${SOCKET_BASE}/uncleteepedia`, {
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    withCredentials: true,
    auth: token ? { token } : {},
    reconnection: true,
    reconnectionAttempts: 20,
    reconnectionDelayMax: 5000,
  });

  let following = followParticipantId ?? null;

  const join = () => {
    socket.emit(
      'join',
      { sessionId, followParticipantId: following, asViewer: forceViewer },
      (response: any) => {
        if (!response?.ok) {
          onError?.(response?.message ?? 'Could not join the live session');
          return;
        }
        if (response.state) onState(response.state, response.role);
      },
    );
  };

  socket.on('connect', join);
  socket.on('session:joined', (payload: UncleTeepediaSocketEnvelope<T>) => {
    if (payload?.state) onState(payload.state, payload.role ?? 'viewer');
  });
  socket.on('session:state', (payload: UncleTeepediaSocketEnvelope<T>) => {
    if (payload?.state) onState(payload.state, payload.role ?? 'viewer');
  });
  socket.on('error', (payload: any) => {
    onError?.(typeof payload === 'string' ? payload : payload?.message ?? 'Live connection error');
  });
  socket.on('connect_error', (error) => {
    onError?.(error?.message ?? 'Live connection unavailable');
  });

  return {
    socket,
    follow(participantId: string | null) {
      following = participantId;
      socket.emit('viewer:follow', { participantId });
    },
    disconnect() {
      socket.removeAllListeners();
      socket.disconnect();
    },
  };
};

/** Promise wrapper around an acknowledgement-based socket command. */
export const emitAck = <T = any,>(
  socket: Socket | null | undefined,
  event: string,
  payload: any = {},
  timeoutMs = 10_000,
): Promise<T> =>
  new Promise((resolve, reject) => {
    if (!socket) {
      reject(new Error('Not connected to the live server'));
      return;
    }
    const timer = window.setTimeout(() => reject(new Error('The live server did not respond')), timeoutMs);
    socket.emit(event, payload, (response: any) => {
      window.clearTimeout(timer);
      if (response?.ok) resolve(response as T);
      else reject(new Error(response?.message ?? 'Command failed'));
    });
  });

export const requestId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
