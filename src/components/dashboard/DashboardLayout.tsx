import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, LogOut, Menu, Search, X } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import { roleMeta, type DashboardNavItem, type DashboardRole } from '@/data/dashboard';
import { siteInfo } from '@/data/content';
import { useAuth } from '@/context/AuthContext';

interface Props {
  role: DashboardRole;
  nav: DashboardNavItem[];
}

const initialsOf = (name: string) =>
  name
    .split(' ')
    .map((p) => p.replace('.', '')[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'LW';

export const DashboardLayout = ({ role, nav }: Props) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, can, logout } = useAuth();
  const meta = roleMeta[role];

  // Admin-configurable visibility: items carrying `permission` are hidden
  // when the signed-in user lacks it. Signed-out preview shows everything.
  const visibleNav = nav.filter((item) => !user || !item.permission || can(item.permission));

  const active = visibleNav.find((item) =>
    item.to === location.pathname
      ? true
      : location.pathname.startsWith(item.to) && item.to !== '/dashboard' && item.to.split('/').length > 2,
  );

  const displayName = user?.user_name ?? meta.title;
  const detail =
    user?.role === 'STUDENT' && user.studentProfile
      ? `${user.studentProfile.className} · ${user.studentProfile.studentCode}`
      : user?.role === 'TEACHER' && user.teacherProfile
        ? `${user.teacherProfile.department ?? 'Teacher'} · ${user.teacherProfile.staffCode}`
        : (user?.role ?? 'Guest');
  const initials = user ? initialsOf(user.user_name) : meta.title.slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.login);
  };

  const sidebar = (
    <div className="flex h-full flex-col bg-brand-900 text-white">
      <Link to={ROUTES.home} className="flex items-center gap-3 border-b border-white/10 px-5 py-5">
        <img src="/logo.png" alt="Learnwithuncletee" className="h-11 w-11 rounded-full border border-white/20 object-cover" />
        <span className="leading-tight">
          <span className="block font-display text-sm font-extrabold">{siteInfo.name}</span>
          <span className="hidden mt-0.5  text-[10px] font-bold uppercase tracking-[.18em] text-lime-accent">{meta.title}</span>
        </span>
      </Link>

      <div className="px-5 pb-2 pt-5">
        <p className="px-1 text-[11px] font-bold uppercase tracking-[.18em] text-white/50">{meta.subtitle}</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4" aria-label={` navigation`}>
        {visibleNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to.split('/').length <= 3}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `group flex items-center justify-between gap-2 rounded px-3 py-3 text-sm font-semibold transition-colors ${
                  isActive ? 'bg-lime-accent text-brand-900' : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="flex items-center gap-3">
                    <Icon size={18} aria-hidden="true" className={isActive ? 'text-brand-900' : 'text-lime-accent'} />
                    {item.label}
                  </span>
                  {item.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        isActive ? 'bg-brand-900 text-lime-accent' : 'bg-white/15 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3 rounded bg-white/10 p-3">
          {user?.img ? (
            <img src={user.img} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime-accent text-sm font-extrabold text-brand-900">
              {initials}
            </span>
          )}
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-bold">{displayName}</span>
            <span className="block truncate text-xs text-white/60">{detail}</span>
          </span>
        </div>
        {user ? (
          <button
            type="button"
            onClick={handleLogout}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded border border-white/20 px-3 py-2.5 text-xs font-bold text-white/80 hover:bg-white/10 hover:text-white"
          >
            <LogOut size={14} aria-hidden="true" /> Sign out
          </button>
        ) : (
          <Link
            to={ROUTES.login}
            className="mt-3 block rounded bg-lime-accent px-3 py-2.5 text-center text-xs font-bold text-brand-900 hover:bg-white"
          >
            Sign in →
          </Link>
        )}
        <Link
          to={ROUTES.home}
          className="mt-2 block rounded px-3 py-2 text-center text-xs font-bold text-white/60 hover:text-white"
        >
          ← Back to website
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-cream font-sans text-ink">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 lg:block">{sidebar}</aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Dashboard menu">
          <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-brand-900/60" />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw]">{sidebar}</aside>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation menu"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded bg-white text-brand-900"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-40 border-b border-line bg-white/95 backdrop-blur">
          <div className="flex min-h-[68px] items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Open navigation menu"
              className="flex h-10 w-10 items-center justify-center rounded border border-line text-brand-800 hover:bg-brand-50 lg:hidden"
            >
              <Menu size={18} aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <p className="hidden text-[11px] font-bold uppercase tracking-[.18em] text-brand-700">{meta.title}</p>
              <h1 className="truncate font-display text-lg font-extrabold leading-tight sm:text-xl">
                {active?.label ?? 'Dashboard'}
              </h1>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <label className="hidden items-center gap-2 rounded border border-line bg-white px-3 py-2 text-sm text-muted focus-within:border-brand-500 md:flex">
                <Search size={15} aria-hidden="true" />
                <input placeholder="Search…" className="w-36 bg-transparent outline-none placeholder:text-muted/70 lg:w-44" />
              </label>
              <button
                type="button"
                aria-label="Notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded border border-line text-brand-800 hover:bg-brand-50"
              >
                <Bell size={17} aria-hidden="true" />
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-500" />
              </button>
              <span className="hidden items-center gap-2 rounded bg-brand-900 py-1.5 pl-1.5 pr-3 text-white sm:flex">
                {user?.img ? (
                  <img src={user.img} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-lime-accent text-[11px] font-extrabold text-brand-900">
                    {initials}
                  </span>
                )}
                <span className="text-xs font-bold">{displayName}</span>
              </span>
            </div>
          </div>
          {!user && (
            <p className="border-t border-line bg-cream px-4 py-2 text-center text-xs text-muted sm:px-6">
              <Link to={ROUTES.login} className="font-bold text-brand-700 underline underline-offset-2">Sign in</Link> to load live data.
            </p>
          )}
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
