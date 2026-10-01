import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { primaryNavLinks, siteInfo } from '@/data/content';

export const Footer = () => (
  <footer className="bg-brand-900 text-white">
    <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr_1.2fr]">
      <div>
        <Link to={ROUTES.home} className="mb-4 flex items-center gap-3">
          <img src="/logo.jpg" alt="" className="h-12 w-12 rounded-full object-cover" />
          <span className="text-lg font-extrabold">{siteInfo.name}</span>
        </Link>
        <p className="max-w-xs text-sm leading-relaxed text-white/70">Nurturing academic excellence, strong character and a supportive environment for every learner.</p>
      </div>
      <div>
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-lime-accent">School</h2>
        <ul className="space-y-2 text-sm text-white/75">
          {primaryNavLinks.slice(1, 5).map((link) => <li key={link.to}><Link className="hover:text-white" to={link.to}>{link.label}</Link></li>)}
        </ul>
      </div>
      <div>
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-lime-accent">Explore</h2>
        <ul className="space-y-2 text-sm text-white/75">
          {[...primaryNavLinks.slice(5), { to: ROUTES.login, label: 'Portal Login' }].map((link) => <li key={link.to}><Link className="hover:text-white" to={link.to}>{link.label}</Link></li>)}
        </ul>
      </div>
      <div>
        <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-lime-accent">Contact</h2>
        <ul className="space-y-3 text-sm text-white/75">
          <li>{siteInfo.address}</li>
          <li>{siteInfo.phone}</li>
          <li>{siteInfo.email}</li>
          <li>{siteInfo.hours}</li>
        </ul>
        <Link to={ROUTES.admissions} className="mt-5 inline-flex rounded bg-lime-accent px-4 py-3 text-sm font-bold text-brand-900 hover:bg-white">Apply Now</Link>
      </div>
    </div>
    <div className="border-t border-white/15 px-5 py-5 text-center text-xs text-white/55">
      © {new Date().getFullYear()} {siteInfo.name}. All rights reserved. School details are pending confirmation.
    </div>
  </footer>
);
