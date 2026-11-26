import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes/paths';
import { primaryNavLinks, siteInfo } from '@/data/content';
import { avatarOf, useAuth } from '@/context/AuthContext';
import { LayoutDashboard, LogOut, Menu, X } from 'lucide-react';

const homeForRole = (role: string) =>
  role === 'STUDENT' || role === 'PARENT'
    ? ROUTES.studentDashboard
    : role === 'TEACHER'
      ? ROUTES.teacherDashboard
      : ROUTES.adminDashboard;

/**
 * Animated active indicator.
 * - Active: dot scales in, with a soft pulsing ring around it.
 * - Inactive: hidden, but a faint dot previews on hover (parent needs `group`).
 */
const NavDot = ({ active, className = '' }: { active: boolean; className?: string }) => (
  <span aria-hidden="true" className={`pointer-events-none flex h-2.5 w-2.5 items-center justify-center ${className}`}>
    
    <span
      className={`relative h-1.5 w-1.5 rounded-full bg-brand-500 transition-all duration-300 ease-out ${
        active
          ? 'scale-100 opacity-100'
          : 'scale-0 opacity-0 group-hover:scale-75 group-hover:opacity-50'
      }`}
    />
  </span>
);

export const Navbar = () => {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the account popover on navigation or Escape.
  useEffect(() => {
    setMenuOpen(false);
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClick);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate(ROUTES.home);
  };

  const avatar = avatarOf(user);
  const initials = user
    ? user.user_name.split(' ').map((p) => p.replace('.', '')[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'LW'
    : '';

  // The avatar chip is rendered in both the desktop and mobile bars (CSS shows
  // one at a time). The popover itself is rendered ONCE, anchored to the
  // sticky header below — so there's never a duplicate or ref race.
  const avatarChip = (
    <button
      type="button"
      onClick={() => setMenuOpen(true)}
      aria-label="Account menu"
      aria-expanded={menuOpen}
      aria-haspopup="menu"
      className="flex items-center gap-2 rounded-full border border-line py-1 pl-1 pr-2 hover:border-brand-500"
    >
      {avatar ? (
        <img src={avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
      ) : (
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-900 text-[11px] font-extrabold text-lime-accent">
          {initials}
        </span>
      )}
      <span className="max-w-[100px] truncate text-xs font-bold">{user?.user_name}</span>
    </button>
  );

  const accountPopover = menuOpen && (
    <div ref={menuRef} role="menu" aria-label="Account" className="absolute right-10 top-full z-50 mt-2 w-52 overflow-hidden rounded border border-line bg-white shadow-xl sm:right-8">
      <p className="truncate border-b border-line bg-cream px-4 py-2.5 text-xs text-muted">{user?.user_email}</p>
      <Link
        to={user ? homeForRole(user.role) : ROUTES.dashboard}
        role="menuitem"
        className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-ink hover:bg-brand-50 hover:text-brand-700"
      >
        <LayoutDashboard aria-hidden="true" size={15} /> Dashboard
      </Link>
      <button
        type="button"
        role="menuitem"
        onClick={handleLogout}
        className="flex w-full items-center gap-2 px-4 py-3 text-sm font-bold text-rose-700 hover:bg-rose-50"
      >
        <LogOut aria-hidden="true" size={15} /> Logout
      </button>
    </div>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-line bg-white/95 backdrop-blur">
      <div className="hidden border-b border-line bg-brand-900 text-xs text-white/80 lg:block">
        <div className="mx-auto flex justify-between px-8 py-2">
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
      <nav className="mx-auto flex min-h-[76px] items-center justify-between gap-4 px-5 sm:px-8">
        <Link to={ROUTES.home} className="flex shrink-0 items-center gap-2" aria-label="Learnwithuncletee home">
          <img src="/logo.png" alt="Learnwithuncletee" className="h-12 w-12 rounded-full border border-line object-cover" />
          <span className="max-w-[145px] text-sm font-extrabold leading-tight text-ink sm:max-w-none sm:text-base">
            Learnwithuncletee
            <span className="mt-0.5 hidden text-[10px] font-semibold uppercase tracking-widest text-brand-600">School</span>
          </span>
        </Link>

        {/* Desktop links: dot sits centered under the active label */}
        <div className="hidden items-center gap-1 xl:flex">
          {primaryNavLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `group relative rounded px-2.5 py-2 pb-3 text-xs font-semibold transition-colors ${
                  isActive ? 'text-brand-700' : 'text-muted hover:text-brand-700'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {l.label}
                  <NavDot active={isActive} className="absolute bottom-0.5 left-1/2 -translate-x-1/2" />
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="hidden shrink-0 items-center gap-2 xl:flex">
          {user ? (
            avatarChip
          ) : (
            <Link to={ROUTES.login} className="rounded px-3 py-2 text-sm font-bold text-brand-700 hover:bg-brand-50">Portal Login</Link>
          )}
          <Link to={ROUTES.admissions} className="rounded bg-brand-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-700">Apply Now</Link>
        </div>

        <div className="flex items-center gap-2 xl:hidden">
          {user ? (
            avatarChip
          ) : (
            <Link to={ROUTES.login} className="hidden rounded px-3 py-2 text-sm font-bold text-brand-700 sm:inline-flex">Portal</Link>
          )}
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

      {accountPopover}
      {open && (
        <div className="border-t border-line bg-white px-5 py-3 xl:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 sm:grid sm:grid-cols-2">
            {primaryNavLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `group flex items-center gap-2.5 rounded px-3 py-3 text-sm font-semibold transition-colors ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'text-ink hover:bg-brand-50'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <NavDot active={isActive} className="relative shrink-0" />
                    {l.label}
                  </>
                )}
              </NavLink>
            ))}
            <Link to={ROUTES.admissions} onClick={() => setOpen(false)} className="mt-2 rounded bg-brand-500 px-3 py-3 text-center text-sm font-bold text-white hover:bg-brand-700 sm:col-span-2">Apply Now</Link>
            <Link to={ROUTES.login} onClick={() => setOpen(false)} className="rounded px-3 py-3 text-sm font-semibold text-brand-700 hover:bg-brand-50 sm:hidden">Portal Login</Link>
          </div>
        </div>
      )}
    </header>
  );
};