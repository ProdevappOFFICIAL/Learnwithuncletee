import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ClipboardList, CreditCard, GraduationCap, Info, UserCheck, Video, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { apiGet } from '@/lib/api';

export interface FeedItem {
  id: string;
  kind: string;
  title: string;
  detail: string;
  to: string;
}

const kindIcon = (kind: string) => {
  switch (kind) {
    case 'fees':
      return CreditCard;
    case 'assignments':
      return ClipboardList;
    case 'live':
      return Video;
    case 'grading':
      return GraduationCap;
    case 'approvals':
      return UserCheck;
    default:
      return Info;
  }
};

const seenKey = (userId: string) => `lwu_notif_seen_${userId}`;

export const readSeen = (userId: string | undefined): string[] => {
  if (!userId) return [];
  try {
    return JSON.parse(localStorage.getItem(seenKey(userId)) ?? '[]') as string[];
  } catch {
    return [];
  }
};

export const markSeen = (userId: string | undefined, ids: string[]) => {
  if (!userId) return;
  try {
    const prev = new Set(readSeen(userId));
    ids.forEach((id) => prev.add(id));
    localStorage.setItem(seenKey(userId), JSON.stringify([...prev]));
  } catch {
    /* ignore */
  }
};

export const NotificationDrawer = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<FeedItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (!user) {
      setItems(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setItems(null);
    setError(null);
    apiGet<FeedItem[]>('/dashboard/notifications')
      .then((res) => {
        if (!cancelled) setItems(res.data);
      })
      .catch((e: any) => {
        if (!cancelled) setError(e?.message ?? 'Could not load notifications');
      });
    return () => {
      cancelled = true;
    };
  }, [open, user?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const close = () => {
    if (user && items) markSeen(user.id, items.map((i) => i.id));
    onClose();
  };

  const go = (to: string) => {
    close();
    if (to) navigate(to);
  };

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={close}
        className={`absolute inset-0 bg-brand-900/60 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Notifications"
        className={`absolute inset-y-0 right-0 flex w-96 max-w-[92vw] flex-col bg-white shadow-xl transition-transform duration-200 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-extrabold">Notifications</h2>
            <p className="text-xs text-muted">{user ? `For ${user.user_name}` : 'Sign in to see yours'}</p>
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close notifications"
            className="flex h-10 w-10 items-center justify-center rounded border border-line text-brand-800 hover:bg-brand-50"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!user ? (
            <p className="px-5 py-8 text-center text-sm text-muted">Sign in to load your notifications.</p>
          ) : error ? (
            <p role="alert" className="m-5 border-l-2 border-rose-400 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
          ) : !items ? (
            <div className="space-y-3 px-5 py-5" aria-label="Loading">
              {[0, 1, 2].map((i) => <div key={i} className="h-16 animate-pulse rounded bg-brand-50" />)}
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {items.map((item) => {
                const Icon = kindIcon(item.kind);
                const seen = readSeen(user.id).includes(item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => go(item.to)}
                      className="flex w-full items-start gap-3 px-5 py-4 text-left hover:bg-brand-50"
                    >
                      <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${seen ? 'bg-brand-50 text-muted' : 'bg-brand-900 text-lime-accent'}`}>
                        <Icon size={16} aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-bold">{item.title}</span>
                          {!seen && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-label="Unread" />}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-muted">{item.detail}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>
    </div>
  );
};
