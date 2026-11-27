import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastTone = 'ok' | 'error' | 'info';

interface ToastItem {
  id: number;
  text: string;
  tone: ToastTone;
  duration: number;
}

interface ToastApi {
  show: (text: string, tone?: ToastTone, duration?: number) => number;
  success: (text: string, duration?: number) => number;
  error: (text: string, duration?: number) => number;
  info: (text: string, duration?: number) => number;
  dismiss: (id: number) => void;
}

const ToastCtx = createContext<ToastApi>({
  show: () => -1,
  success: () => -1,
  error: () => -1,
  info: () => -1,
  dismiss: () => {},
});

export const useToast = () => useContext(ToastCtx);

const toneStyles: Record<
  ToastTone,
  { box: string; icon: string; Icon: typeof Info }
> = {
  ok: {
    box: 'border-line border-l-brand-500 bg-white text-brand-900',
    icon: 'text-brand-600',
    Icon: CheckCircle2,
  },
  error: {
    box: 'border-line border-l-rose-500 bg-white text-rose-900',
    icon: 'text-rose-600',
    Icon: AlertTriangle,
  },
  info: {
    box: 'border-line border-l-brand-400 bg-white text-brand-900',
    icon: 'text-brand-600',
    Icon: Info,
  },
};

const ToastViewport = ({
  items,
  onDismiss,
}: {
  items: ToastItem[];
  onDismiss: (id: number) => void;
}) => (
  <div
    aria-live="polite"
    aria-atomic="false"
    className="pointer-events-none fixed inset-x-0 bottom-20 z-[80] flex flex-col items-center gap-2 px-3 print:hidden xl:hidden"
  >
    {items.map((item) => {
      const tone = toneStyles[item.tone];
      const Icon = tone.Icon;
      return (
        <div
          key={item.id}
          role={item.tone === 'error' ? 'alert' : 'status'}
          className={`lwu-toast pointer-events-auto flex w-full max-w-md items-start gap-3 rounded border border-l-4 px-4 py-3 shadow-xl ${tone.box}`}
        >
          <Icon size={18} aria-hidden="true" className={`mt-0.5 shrink-0 ${tone.icon}`} />
          <p className="min-w-0 flex-1 text-sm font-semibold leading-5">{item.text}</p>
          <button
            type="button"
            onClick={() => onDismiss(item.id)}
            aria-label="Dismiss message"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted hover:bg-cream hover:text-ink"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>
      );
    })}
  </div>
);

/**
 * App-wide responsive feedback. On phones/tablets messages appear as toasts
 * above the mobile action bar; `xl` and up keep the existing inline notice
 * styling on each page. The viewport itself is `xl:hidden`, so a page can
 * safely call `toast.show()` for every notice.
 */
export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef<Map<number, number>>(new Map());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) {
      window.clearTimeout(timer);
      timers.current.delete(id);
    }
    setItems((previous) => previous.filter((item) => item.id !== id));
  }, []);

  const show = useCallback(
    (text: string, tone: ToastTone = 'info', duration?: number) => {
      if (!text.trim()) return -1;
      const id = nextId.current++;
      const ms = duration ?? (tone === 'error' ? 6500 : 4000);
      setItems((previous) => [...previous.slice(-2), { id, text, tone, duration: ms }]);
      const timer = window.setTimeout(() => dismiss(id), ms);
      timers.current.set(id, timer);
      return id;
    },
    [dismiss],
  );

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current.clear();
    },
    [],
  );

  const value = useMemo<ToastApi>(
    () => ({
      show,
      success: (text, duration) => show(text, 'ok', duration),
      error: (text, duration) => show(text, 'error', duration),
      info: (text, duration) => show(text, 'info', duration),
      dismiss,
    }),
    [show, dismiss],
  );

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} />
    </ToastCtx.Provider>
  );
};
