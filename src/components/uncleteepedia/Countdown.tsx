import { useEffect, useMemo, useState } from 'react';

const clock = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

/**
 * Display-only countdown. Every deadline it renders comes from the server;
 * the browser never decides whether an answer is late.
 */
export const Countdown = ({
  endsAt,
  pausedAt,
  label,
  size = 'md',
  tone = 'brand',
}: {
  endsAt?: string | null;
  pausedAt?: string | null;
  label?: string;
  size?: 'sm' | 'md' | 'xl';
  tone?: 'brand' | 'light';
}) => {
  const frozen = pausedAt ? new Date(pausedAt).getTime() : null;
  const end = endsAt ? new Date(endsAt).getTime() : null;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!end) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [end]);

  const remaining = useMemo(() => {
    if (!end) return 0;
    return Math.max(0, end - (frozen ?? now));
  }, [end, frozen, now]);

  const expired = Boolean(end && remaining <= 0);
  const danger = remaining <= 10_000;

  const sizeClass =
    size === 'xl'
      ? 'font-display text-6xl font-black tracking-tight sm:text-7xl'
      : size === 'sm'
        ? 'font-display text-xl font-extrabold'
        : 'font-display text-4xl font-extrabold';

  return (
    <div
      className={`inline-flex flex-col items-center rounded border px-5 py-3 ${
        tone === 'light'
          ? 'border-white/25 bg-white/10 text-white'
          : danger
            ? 'border-rose-200 bg-rose-50 text-rose-700'
            : 'border-brand-200 bg-brand-50 text-brand-800'
      }`}
      aria-live="off"
    >
      {label && <span className="text-[10px] font-bold uppercase tracking-[.22em] opacity-70">{label}</span>}
      <span className={`${sizeClass} tabular-nums ${expired ? 'opacity-60' : ''}`}>
        {end ? clock(remaining) : '--:--'}
      </span>
      {pausedAt && <span className="mt-1 text-[10px] font-bold uppercase tracking-widest">Paused</span>}
    </div>
  );
};
