import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';

export const ConversionBanner = () => (
  <section className="bg-brand-800 text-white">
    <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-14 sm:px-8 md:flex-row md:items-center">
      <div className="max-w-2xl">
        <p className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-lime-accent">Admissions</p>
        <h2 className="text-3xl font-extrabold sm:text-4xl">Ready to begin your child’s journey?</h2>
        <p className="mt-3 text-white/75">Take the first step or speak with our admissions team.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          to={ROUTES.admissions}
          className="rounded bg-lime-accent px-6 py-3.5 text-sm font-bold text-brand-900 hover:bg-white"
        >
          Apply Now
        </Link>
        <Link
          to={ROUTES.contact}
          className="rounded border border-white/50 px-6 py-3 text-sm font-bold text-white hover:bg-white/10"
        >
          Contact Admissions
        </Link>
      </div>
    </div>
  </section>
);
