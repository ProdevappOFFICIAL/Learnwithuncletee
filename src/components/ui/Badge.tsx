import type { ReactNode } from 'react';

export const Badge = ({ children, tone = 'amber' }: { children: ReactNode; tone?: string }) => {
  const tones: Record<string, string> = {
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    sky: 'bg-sky-100 text-sky-800 border-sky-200',
    violet: 'bg-violet-100 text-violet-800 border-violet-200',
    ink: 'bg-slate-900 text-white border-slate-900',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${tones[tone] ?? tones.amber}`}
    >
      {children}
    </span>
  );
};

export const HandwrittenBadge = ({ children }: { children: ReactNode }) => (
  <span className="inline-block -rotate-2 rounded-lg bg-amber-200 px-3 py-1 font-[cursive] text-sm text-slate-900 shadow-sm border-2 border-dashed border-amber-500/50">
    ✏️ {children}
  </span>
);
