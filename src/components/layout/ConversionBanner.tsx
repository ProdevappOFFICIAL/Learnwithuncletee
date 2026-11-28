import { Link } from 'react-router-dom';
import { SiteText, useSiteGlobal } from '@/site/SiteContent';

export const ConversionBanner = () => {
  const site = useSiteGlobal();
  const cta = site.cta ?? {};
  return (
    <section className="bg-brand-800 text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-5 py-14 sm:px-8 md:flex-row md:items-center">
        <div className="max-w-2xl">
          <SiteText path="global.cta.eyebrow" value={cta.eyebrow} as="p" className="mb-2 text-xs font-bold uppercase tracking-[.18em] text-lime-accent" />
          <SiteText path="global.cta.title" value={cta.title} as="h2" className="text-3xl font-extrabold sm:text-4xl" />
          <SiteText path="global.cta.text" value={cta.text} as="p" className="mt-3 text-white/75" multiline />
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to={cta.primaryTo ?? '/admissions'} className="rounded bg-lime-accent px-6 py-3.5 text-sm font-bold text-brand-900 hover:bg-white">
            <SiteText path="global.cta.primaryLabel" value={cta.primaryLabel} />
          </Link>
          <Link to={cta.secondaryTo ?? '/contact'} className="rounded border border-white/50 px-6 py-3 text-sm font-bold text-white hover:bg-white/10">
            <SiteText path="global.cta.secondaryLabel" value={cta.secondaryLabel} />
          </Link>
        </div>
      </div>
    </section>
  );
};
