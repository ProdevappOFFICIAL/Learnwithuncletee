import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { SiteImage, SiteText, useSiteGlobal } from '@/site/SiteContent';

export const Footer = () => {
  const site = useSiteGlobal();
  const navLinks = (site.nav ?? []) as Array<{ label: string; to: string }>;
  const secondary = [
    ...navLinks.slice(5),
    { to: ROUTES.uncleTeepedia, label: 'UncleTeepedia Live' },
    { to: ROUTES.examDashboard, label: 'Examination Portal' },
    { to: ROUTES.login, label: 'Portal Login' },
  ];

  return (
    <footer className="bg-brand-900 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
        <div>
          <Link to={ROUTES.home} className="mb-4 flex items-center gap-3">
            <SiteImage path="global.logo" src={site.logo} alt={`${site.siteName} logo`} className="h-12 w-12 rounded-full object-cover" />
            <SiteText path="global.siteName" value={site.siteName} className="text-lg font-extrabold" />
          </Link>
          <SiteText path="global.footerText" value={site.footerText} as="p" className="max-w-xs text-sm leading-relaxed text-white/70" multiline />
        </div>
        <div>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-lime-accent">School</h2>
          <ul className="space-y-2 text-sm text-white/75">
            {navLinks.slice(1, 5).map((link, index) => (
              <li key={`${link.to}-${index}`}>
                <Link className="hover:text-white" to={link.to}>
                  <SiteText path={`global.nav.${index + 1}.label`} value={link.label} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-lime-accent">Explore</h2>
          <ul className="space-y-2 text-sm text-white/75">
            {secondary.map((link, index) => (
              <li key={`${link.to}-${index}`}>
                <Link className="hover:text-white" to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-lime-accent">Contact</h2>
          <ul className="space-y-3 text-sm text-white/75">
            <li><SiteText path="global.address" value={site.address} /></li>
            {(site.phoneContacts ?? []).map((contact: any, index: number) => (
              <li key={`${contact.label}-${index}`}>
                <a href={contact.href} className="hover:text-white">
                  <SiteText path={`global.phoneContacts.${index}.label`} value={contact.label} />:{' '}
                  <SiteText path={`global.phoneContacts.${index}.number`} value={contact.number} />
                </a>
              </li>
            ))}
            <li><SiteText path="global.email" value={site.email} /></li>
            <li><SiteText path="global.hours" value={site.hours} /></li>
          </ul>
          <Link to={ROUTES.admissions} className="mt-5 inline-flex rounded bg-lime-accent px-4 py-3 text-sm font-bold text-brand-900 hover:bg-white">
            <SiteText path="global.applyLabel" value={site.applyLabel ?? 'Apply Now'} />
          </Link>
        </div>
      </div>
      <div className="border-t border-white/15 px-5 py-5 text-center text-xs text-white/55">
        © {new Date().getFullYear()} <SiteText path="global.siteName" value={site.siteName} />. {' '}
        <SiteText path="global.copyright" value={site.copyright} />
      </div>
    </footer>
  );
};
