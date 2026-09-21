import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';

export const ConversionBanner = () => (
  <section className="bg-indigo-950">
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-12 sm:px-6 md:flex-row md:py-14">
      <div className="max-w-xl text-center md:text-left">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Join 25,000+ learners</p>
        <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
          Start learning smarter today — it's free to explore.
        </h2>
        <p className="mt-2 text-indigo-200">Instant downloads. Structured lessons. Support for the whole family.</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          to={ROUTES.resources}
          className="rounded-full bg-amber-400 px-7 py-3.5 text-sm font-bold text-slate-900 shadow-xl transition-transform hover:-translate-y-0.5 hover:bg-amber-300"
        >
          Browse Free Resources
        </Link>
        <Link
          to={ROUTES.students}
          className="rounded-full border-2 border-white/30 px-7 py-3 text-sm font-bold text-white transition-colors hover:border-white hover:bg-white/10"
        >
          Create Free Account
        </Link>
      </div>
    </div>
  </section>
);
