import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export const PageHeader = ({
  eyebrow,
  title,
  text,
  actions,
}: {
  eyebrow: string;
  title: string;
  text?: string;
  actions?: ReactNode;
}) => (
  <div className="flex flex-wrap items-end justify-between gap-4">
    <div className="max-w-2xl">
      <p className="hidden  items-center border-l-2 border-brand-500 pl-3 text-xs font-bold uppercase tracking-widest text-brand-700">
        {eyebrow}
      </p>
      <h2 className="mt-2 font-display text-2xl font-extrabold text-ink sm:text-3xl">{title}</h2>
      {text && <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">{text}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

export const StatTile = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="border border-line bg-white p-5">
    <p className="border-l-2 border-brand-400 pl-3 text-xs font-bold uppercase tracking-widest text-muted">{label}</p>
    <p className="mt-3 font-display text-3xl font-extrabold text-brand-700">{value}</p>
    {hint && <p className="mt-1 text-xs font-semibold text-muted">{hint}</p>}
  </div>
);

export const Card = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <section className={`border border-line bg-white ${className}`}>{children}</section>
);

export const CardHead = ({ title, sub, link }: { title: string; sub?: string; link?: { to: string; label: string } }) => (
  <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
    <div>
      <h3 className="font-display text-base font-extrabold text-ink">{title}</h3>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </div>
    {link && (
      <Link to={link.to} className="text-xs font-bold text-brand-700 underline underline-offset-4 hover:text-brand-500">
        {link.label}
      </Link>
    )}
  </div>
);

export const Pill = ({ tone = 'amber', children }: { tone?: 'amber' | 'emerald' | 'sky' | 'violet' | 'ink' | 'rose'; children: ReactNode }) => {
  const tones: Record<string, string> = {
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    emerald: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    sky: 'bg-sky-100 text-sky-800 border-sky-200',
    violet: 'bg-violet-100 text-violet-800 border-violet-200',
    ink: 'bg-brand-900 text-white border-brand-900',
    rose: 'bg-rose-100 text-rose-800 border-rose-200',
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${tones[tone]}`}>
      {children}
    </span>
  );
};

export const BannerCard = ({
  eyebrow,
  title,
  text,
  image = '/school.JPG',
  action,
}: {
  eyebrow: string;
  title: string;
  text: string;
  image?: string;
  action?: ReactNode;
}) => (
  <section
    className="relative isolate overflow-hidden rounded bg-brand-900 p-6 text-white sm:p-8"
    style={{
      backgroundImage: `linear-gradient(90deg, rgba(4,46,26,.94) 0%, rgba(4,58,33,.72) 55%, rgba(4,58,33,.28) 100%), url(${image})`,
      backgroundPosition: 'center',
      backgroundSize: 'cover',
    }}
  >
    <div className="relative max-w-xl">
      <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.18em] text-lime-accent">
        <img src="/logo.png" alt="" className="h-6 w-6 rounded-full border border-white/30 object-cover" />
        {eyebrow}
      </p>
      <h2 className="mt-3 font-display text-2xl font-extrabold leading-tight sm:text-3xl">{title}</h2>
      <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/85">{text}</p>
      {action && <div className="mt-5 flex flex-wrap gap-2">{action}</div>}
    </div>
  </section>
);

export const TableWrap = ({ children }: { children: ReactNode }) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
  </div>
);

export const Th = ({ children }: { children: ReactNode }) => (
  <th className="border-b border-line bg-brand-50/60 px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-brand-700">
    {children}
  </th>
);

export const Td = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <td className={`border-b border-line px-5 py-3.5 align-top text-ink ${className}`}>{children}</td>
);

export const LoadingSkeleton = ({ rows = 4 }: { rows?: number }) => (
  <div className="space-y-3" role="status" aria-label="Loading">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="h-12 animate-pulse rounded bg-brand-50" />
    ))}
    <span className="sr-only">Loading…</span>
  </div>
);

export const ErrorState = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800" role="alert">
    <p className="font-bold">Couldn't load this section</p>
    <p className="mt-1">{message}. Is the API running ({'VITE_API_URL'}) and are you signed in?</p>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded bg-brand-900 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700"
      >
        Retry
      </button>
    )}
  </div>
);

export const EmptyState = ({ message }: { message: string }) => (
  <p className="border border-dashed border-line bg-cream px-5 py-6 text-center text-sm text-muted">{message}</p>
);
