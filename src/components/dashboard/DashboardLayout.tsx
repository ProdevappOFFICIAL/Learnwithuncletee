import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, ChevronLeft, LogOut, Menu, Search, X } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import { roleMeta, type DashboardNavItem, type DashboardRole } from '@/data/dashboard';
import { siteInfo } from '@/data/content';
import { avatarOf, useAuth } from '@/context/AuthContext';
import { apiGet } from '@/lib/api';
import { NotificationDrawer, readSeen, type FeedItem } from './NotificationDrawer';
import { AccountDialog } from './AccountDialog';

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
  // Groups survive only while at least one child remains visible.
  const filterVisible = (items: DashboardNavItem[]): DashboardNavItem[] =>
    items.flatMap((item) => {
      if (item.children) {
        const kids = filterVisible(item.children);
        if (!kids.length) return [];
        return [{ ...item, children: kids }];
      }
      if (!user || !item.permission || can(item.permission)) return [item];
      return [];
    });
  const visibleNav = filterVisible(nav);

  const isLeafActive = (to?: string) =>
    !!to &&
    (location.pathname === to ||
      (to.split('/').length > 2 && to !== '/dashboard' && location.pathname.startsWith(to)));

  const containsActive = (item: DashboardNavItem): boolean =>
    isLeafActive(item.to) || !!item.children?.some(containsActive);

  /** Deepest matching leaf label for the topbar title. */
  const findActiveLabel = (items: DashboardNavItem[]): string | null => {
    let best: string | null = null;
    let bestLen = -1;
    const walk = (list: DashboardNavItem[]) => {
      for (const item of list) {
        if (item.to && isLeafActive(item.to) && item.to.length > bestLen) {
          best = item.label;
          bestLen = item.to.length;
        }
        if (item.children) walk(item.children);
      }
    };
    walk(items);
    return best;
  };
  const activeLabel = findActiveLabel(visibleNav);

  // Expanded groups, keyed by label path (labels repeat, e.g. two "Results").
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Auto-expand every ancestor of the active route on navigation.
  // Children are checked before a group's own `to` so drill-down pages
  // expand the full chain; a group also expands on its own overview page.
  useEffect(() => {
    const chain: string[] = [];
    const walk = (list: DashboardNavItem[], prefix: string): boolean => {
      for (const item of list) {
        const key = `${prefix}/${item.label}`;
        if (item.children && walk(item.children, key)) {
          chain.push(key);
          return true;
        }
        if (isLeafActive(item.to)) {
          chain.push(key);
          return true;
        }
      }
      return false;
    };
    walk(visibleNav, '');
    if (chain.length) setExpanded((prev) => ({ ...prev, ...Object.fromEntries(chain.map((k) => [k, true])) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const toggleGroup = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const renderNode = (item: DashboardNavItem, pathKey: string, depth: number): React.ReactNode => {
    const key = `${pathKey}/${item.label}`;
    const Icon = item.icon;
    if (item.children?.length) {
      const open = expanded[key] ?? containsActive(item);
      // Split-button group: the label navigates to the group's own overview
      // page (when `to` is set; NavLink highlights it when exact), the
      // chevron only expands/collapses.
      return (
        <div key={key}>
          <div
            className="flex items-center gap-1 rounded transition-colors hover:bg-white/10"
            style={{ paddingLeft: 12 + depth * 14 }}
          >
            {item.to ? (
              <NavLink
                to={item.to}
                end={false}
                onClick={() => {
                  setOpen(false);
                  setExpanded((prev) => ({ ...prev, [key]: true }));
                }}
                aria-label={item.label}
                className={({ isActive }) =>
                  `flex min-w-0 flex-1 items-center gap-3 rounded-full px-3 py-3 text-sm font-semibold transition-colors ${
                    isActive ? 'bg-lime-accent text-brand-900' : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} aria-hidden="true" className={`shrink-0 ${isActive ? 'text-brand-900' : 'text-lime-accent'}`} />
                    <span className="truncate">{item.label}</span>
                    
                  </>
                )}
                
              </NavLink>
            ) : (
              <span className="flex min-w-0 flex-1 items-center gap-3 py-3 pr-1 text-sm font-semibold text-white/80">
                <Icon size={18} aria-hidden="true" className="shrink-0 text-lime-accent" />
                <span className="truncate">{item.label}</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => toggleGroup(key)}
              aria-expanded={open}
              aria-label={`${open ? 'Collapse' : 'Expand'} ${item.label}`}
              className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded text-white/60 hover:bg-white/10 hover:text-white"
            >
              <ChevronDown
                size={15}
                aria-hidden="true"
                className={`transition-transform ${open ? '' : '-rotate-90'}`}
              />
            </button>
          </div>
          {open && (
            <div className="space-y-1">
              {item.children.map((child) => renderNode(child, key, depth + 1))}
            </div>
          )}
        </div>
      );
    }
    if (!item.to) return null;
    const to = item.to;
    return (
      <NavLink
        key={key}
        to={to}
        end={to.split('/').length <= 3}
        onClick={() => setOpen(false)}
        style={{ paddingLeft: 12 + depth * 14 }}
        className={({ isActive }) =>
          `group flex items-center justify-between gap-2 rounded-full px-3 py-3 text-sm font-semibold transition-colors ${
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
  };

  const displayName = user?.user_name ?? meta.title;
  const detail =
    user?.role === 'STUDENT' && user.student
      ? `${user.student.className} · ${user.student.studentCode}`
      : user?.role === 'TEACHER' && user.teacher
        ? `${user.teacher.department ?? 'Teacher'} · ${user.teacher.staffCode}`
        : (user?.role ?? 'Guest');
  const initials = user ? initialsOf(user.user_name) : meta.title.slice(0, 2).toUpperCase();
  const avatar = avatarOf(user);

  const [notifOpen, setNotifOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  // Badge count: fetch feed silently, diff against locally-seen ids.
  useEffect(() => {
    if (!user) {
      setUnread(0);
      return;
    }
    let cancelled = false;
    apiGet<FeedItem[]>('/dashboard/notifications')
      .then((res) => {
        if (cancelled) return;
        const seen = new Set(readSeen(user.id));
        setUnread(res.data.filter((i) => !seen.has(i.id) && i.kind !== 'info').length);
      })
      .catch(() => {
        /* badge stays hidden when offline */
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, notifOpen]);

  const openNotif = () => setNotifOpen(true);
  const closeNotif = () => {
    // Recompute badge from what the drawer just marked seen.
    setNotifOpen(false);
  };

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
        <p className="hidden px-1 text-[11px] font-bold uppercase tracking-[.18em] text-white/50">{meta.subtitle}</p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4" aria-label={` navigation`}>
        {visibleNav.map((item) => renderNode(item, '', 0))}
      </nav>

      <div className="border-t border-white/10 p-4">
        <button type="button" onClick={() => setAccountOpen(true)} aria-label="Open account settings" className="flex w-full items-center gap-3 rounded bg-white/10 p-3 text-left hover:bg-white/15">
          {avatar ? (
            <img src={avatar} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime-accent text-sm font-extrabold text-brand-900">
              {initials}
            </span>
          )}
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-bold">{displayName}</span>
            <span className="block truncate text-xs text-white/60">{detail}</span>
          </span>
        </button>
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
          className="flex mt-2 gap-2 items-center justify-center rounded px-3 py-2 text-center text-xs font-bold text-white/60 hover:text-white"
        >
          <ChevronLeft size={14} aria-hidden="true" /> Back to website
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
                {activeLabel ?? 'Dashboard'}
              </h1>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <label className="hidden items-center gap-2 rounded border border-line bg-white px-3 py-2 text-sm text-muted focus-within:border-brand-500 md:flex">
                <Search size={15} aria-hidden="true" />
                <input placeholder="Search…" className="w-36 bg-transparent outline-none placeholder:text-muted/70 lg:w-44" />
              </label>
              <button
                type="button"
                onClick={openNotif}
                aria-label={unread > 0 ? `Notifications, ${unread} unread` : 'Notifications'}
                className="relative flex h-10 w-10 items-center justify-center rounded border border-line text-brand-800 hover:bg-brand-50"
              >
                <Bell size={17} aria-hidden="true" />
                {unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-extrabold text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setAccountOpen(true)}
                aria-label="Account settings"
                className="hidden items-center gap-2 rounded bg-brand-900 py-1.5 pl-1.5 pr-3 text-white hover:bg-brand-700 sm:flex"
              >
                {avatar ? (
                  <img src={avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-lime-accent text-[11px] font-extrabold text-brand-900">
                    {initials}
                  </span>
                )}
                <span className="text-xs font-bold">{displayName}</span>
              </button>
            </div>
          </div>
          {!user && (
            <p className="border-t border-line bg-cream px-4 py-2 text-center text-xs text-muted sm:px-6">
              <Link to={ROUTES.login} className="font-bold text-brand-700 underline underline-offset-2">Sign in</Link> to load live data.
            </p>
          )}
        </header>

        <main className="flex-1 px-4  sm:px-6 sm:py-8">
          <div className="mx-auto w-full ">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Overlays live at layout root: the sticky topbar's backdrop-blur would
          otherwise trap `fixed` positioning inside the 68px header. */}
      <NotificationDrawer open={notifOpen} onClose={closeNotif} />
      <AccountDialog open={accountOpen} onClose={() => setAccountOpen(false)} />
    </div>
  );
};
