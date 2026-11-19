import { useMemo, useState } from 'react';
import { Check, MessageSquarePlus, Pencil, Search, Trash2, X } from 'lucide-react';
import type { AiChatSessionSummary } from '@/lib/aiChat';

const dayStart = (value: string) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const relative = (value: string) => {
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  if (diff < 60_000) return 'now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
};

const groupsOf = (sessions: AiChatSessionSummary[]) => {
  const now = new Date();
  const today = dayStart(now.toISOString());
  const yesterday = today - 86_400_000;
  const week = today - 7 * 86_400_000;
  const groups: Array<{ label: string; rows: AiChatSessionSummary[] }> = [
    { label: 'Today', rows: [] },
    { label: 'Yesterday', rows: [] },
    { label: 'Previous 7 days', rows: [] },
    { label: 'Older', rows: [] },
  ];
  for (const session of sessions) {
    const at = dayStart(session.lastMessageAt);
    if (at >= today) groups[0].rows.push(session);
    else if (at >= yesterday) groups[1].rows.push(session);
    else if (at >= week) groups[2].rows.push(session);
    else groups[3].rows.push(session);
  }
  return groups.filter((group) => group.rows.length > 0);
};

export const ChatSessionRail = ({
  sessions,
  activeId,
  loading,
  error,
  onSelect,
  onNew,
  onRename,
  onDelete,
}: {
  sessions: AiChatSessionSummary[];
  activeId: string;
  loading?: boolean;
  error?: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}) => {
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<{ id: string; title: string } | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sessions;
    return sessions.filter(
      (session) =>
        session.title.toLowerCase().includes(query) ||
        session.preview.toLowerCase().includes(query),
    );
  }, [sessions, search]);

  const groups = groupsOf(filtered);

  return (
    <div className="flex h-full min-h-0 flex-col bg-brand-900 text-white">
      <div className="space-y-3 border-b border-white/10 px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-bold uppercase tracking-[.18em] text-white/50">Chats</p>
          <button
            type="button"
            onClick={onNew}
            className="inline-flex items-center gap-1.5 rounded bg-lime-accent px-2.5 py-1.5 text-[11px] font-extrabold text-brand-900 hover:bg-white"
          >
            <MessageSquarePlus size={13} aria-hidden="true" /> New
          </button>
        </div>
        <label className="flex items-center gap-2 rounded border border-white/15 bg-white/[0.04] px-2.5 py-2 text-white/60 focus-within:border-white/40 focus-within:text-white">
          <Search size={14} aria-hidden="true" className="shrink-0" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search chats"
            aria-label="Search chats"
            className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/40"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} aria-label="Clear chat search" className="text-white/50 hover:text-white">
              <X size={12} aria-hidden="true" />
            </button>
          )}
        </label>
      </div>

      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {loading && !sessions.length ? (
          <div className="space-y-2 px-2 py-3">
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className="h-12 animate-pulse rounded bg-white/10" />
            ))}
          </div>
        ) : error ? (
          <p className="px-3 py-3 text-xs text-rose-200">{error}</p>
        ) : !groups.length ? (
          <p className="px-3 py-6 text-center text-xs leading-5 text-white/50">
            {search ? 'No chats match your search.' : 'No chats yet. Start one below.'}
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.label} className="mb-2">
              <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-[.16em] text-white/40">{group.label}</p>
              <div className="space-y-0.5">
                {group.rows.map((session) => {
                  const active = session.id === activeId;
                  const isEditing = editing?.id === session.id;
                  const isConfirming = confirming === session.id;
                  return (
                    <div
                      key={session.id}
                      className={`group relative rounded-md ${
                        active
                          ? 'bg-white/[0.12] text-white'
                          : 'text-white/60 hover:bg-white/[0.07] hover:text-white'
                      }`}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-1 px-2 py-1.5">
                          <input
                            autoFocus
                            value={editing.title}
                            onChange={(event) => setEditing({ ...editing, title: event.target.value })}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                onRename(session.id, editing.title);
                                setEditing(null);
                              }
                              if (event.key === 'Escape') setEditing(null);
                            }}
                            aria-label="Chat title"
                            className="min-w-0 flex-1 rounded border border-white/20 bg-white/10 px-2 py-1 text-xs font-semibold text-white outline-none placeholder:text-white/40 focus:border-white/40"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              onRename(session.id, editing.title);
                              setEditing(null);
                            }}
                            aria-label="Save title"
                            className="rounded p-1 text-white/70 hover:bg-white/10 hover:text-white"
                          >
                            <Check size={13} aria-hidden="true" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSelect(session.id)}
                          className="block w-full px-2.5 py-2.5 text-left"
                          aria-current={active ? 'true' : undefined}
                        >
                          <span className="flex items-center gap-2">
                            <span className="min-w-0 flex-1 truncate text-xs font-semibold">{session.title}</span>
                            <span className={`shrink-0 text-[10px] font-semibold ${active ? 'text-white/50' : 'text-white/35'}`}>
                              {relative(session.lastMessageAt)}
                            </span>
                          </span>
                          {session.preview && (
                            <span className={`mt-0.5 block truncate text-[10px] ${active ? 'text-white/50' : 'text-white/40'}`}>
                              {session.preview}
                            </span>
                          )}
                        </button>
                      )}

                      {!isEditing && (
                        <div className="absolute right-1 top-1 hidden items-center gap-0.5 rounded border border-white/10 bg-brand-900/95 p-0.5 shadow-sm group-hover:flex">
                          {isConfirming ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  onDelete(session.id);
                                  setConfirming(null);
                                }}
                                className="rounded bg-rose-600 px-1.5 py-1 text-[10px] font-bold text-white"
                              >
                                Delete
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirming(null)}
                                aria-label="Cancel delete"
                                className="rounded p-1 text-white/60 hover:bg-white/10 hover:text-white"
                              >
                                <X size={11} aria-hidden="true" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => setEditing({ id: session.id, title: session.title })}
                                aria-label={`Rename ${session.title}`}
                                className="rounded p-1 text-white/60 hover:bg-white/10 hover:text-white"
                              >
                                <Pencil size={11} aria-hidden="true" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirming(session.id)}
                                aria-label={`Delete ${session.title}`}
                                className="rounded p-1 text-white/60 hover:bg-rose-500/20 hover:text-rose-200"
                              >
                                <Trash2 size={11} aria-hidden="true" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="border-t border-white/10 px-4 py-3">
        <p className="text-[10px] leading-4 text-white/40">
          Chats are private to your account. Tool actions follow your permissions.
        </p>
      </div>
    </div>
  );
};
