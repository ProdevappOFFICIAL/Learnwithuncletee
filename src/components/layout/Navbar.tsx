import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { primaryNavLinks, siteInfo } from '@/data/content';
import { Menu, X } from 'lucide-react';

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/95 backdrop-blur">
      <div className="hidden border-b border-line bg-brand-900 text-xs text-white/80 lg:block">
        <div className="mx-auto flex max-w-7xl justify-between px-8 py-2">
          <i className="font-sans">...Lubricating the wheel of education...</i>
          <div className="flex gap-5">
            {siteInfo.phoneContacts.map((contact) => (
              <a key={contact.label} href={contact.href} className="hover:text-white">
                {contact.label}: {contact.number}
              </a>
            ))}
          </div>
        </div>
      </div>
      <nav className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link to={ROUTES.home} className="flex shrink-0 items-center gap-2" aria-label="Learnwithuncletee home">
          <img src="/logo.png" alt="Learnwithuncletee" className="h-12 w-12 rounded-full border border-line object-cover" />
          <span className="max-w-[145px] text-sm font-extrabold leading-tight text-ink sm:max-w-none sm:text-base">
            Learnwithuncletee
            <span className="mt-0.5 block text-[10px] font-semibold uppercase tracking-widest text-brand-600">School</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 xl:flex">
          {primaryNavLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `rounded px-2 py-2 text-xs font-semibold transition-colors ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-muted hover:bg-brand-50 hover:text-brand-700'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden shrink-0 items-center gap-2 xl:flex">
          <Link to={ROUTES.login} className="rounded px-3 py-2 text-sm font-bold text-brand-700 hover:bg-brand-50">Portal Login</Link>
          <Link to={ROUTES.admissions} className="rounded bg-brand-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700">Apply Now</Link>
        </div>

        <div className="flex items-center gap-2 xl:hidden">
          <Link to={ROUTES.login} className="hidden rounded px-3 py-2 text-sm font-bold text-brand-700 sm:inline-flex">Portal</Link>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded border border-line text-xl text-brand-800 hover:bg-brand-50"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={open}
          >
            {open ? <X aria-hidden="true" size={20} /> : <Menu aria-hidden="true" size={20} />}
          </button>
        </div>
      </nav>
      {open && (
        <div className="border-t border-line bg-white px-5 py-3 xl:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 sm:grid sm:grid-cols-2">
            {primaryNavLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `rounded px-3 py-3 text-sm font-semibold ${isActive ? 'bg-brand-50 text-brand-700' : 'text-ink hover:bg-brand-50'}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <Link to={ROUTES.login} onClick={() => setOpen(false)} className="rounded px-3 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50 sm:hidden">Portal Login</Link>
            <Link to={ROUTES.admissions} onClick={() => setOpen(false)} className="mt-2 rounded bg-brand-500 px-3 py-3 text-center text-sm font-bold text-white hover:bg-brand-700 sm:col-span-2">Apply Now</Link>
          </div>
        </div>
      )}
    </header>
  );
};
