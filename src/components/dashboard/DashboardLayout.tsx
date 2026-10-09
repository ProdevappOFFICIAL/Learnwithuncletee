import { Fragment, useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, LogOut, Menu, Search, X } from 'lucide-react';
import { ROUTES } from '@/routes/paths';
import { memberNav, roleMeta, type DashboardNavItem, type DashboardRole } from '@/data/dashboard';
import { siteInfo } from '@/data/content';
import { avatarOf, useAuth } from '@/context/AuthContext';
import { apiGet } from '@/lib/api';
import { NotificationDrawer, readSeen, type FeedItem } from './NotificationDrawer';
import { AccountDialog } from './AccountDialog';

interface Props {
  role: DashboardRole;
  nav: DashboardNavItem[];
}

/**
 * Optional extras a nav item can carry (add them to DashboardNavItem when
 * convenient; read through this type so the layout compiles either way):
 *  - dividerBefore: draws a thin separator above the item (section break)
 *  - disabled: renders the item dimmed and non-interactive
 */
type NavExtras = { dividerBefore?: boolean; disabled?: boolean };
const extras = (item: DashboardNavItem) => item as DashboardNavItem & NavExtras;

const initialsOf = (name: string) =>
  name
    .split(' ')
    .map((p) => p.replace('.', '')[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'LW';

const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

// Sidebar row styling: flat rounded rows, muted by default, soft grey fill
// for hover and active. No coloured pills.
const rowBase =
  'group relative flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40';
const rowIdle = 'text-white/60 hover:bg-white/[0.07] hover:text-white';
const rowActive = 'bg-white/[0.12] text-white';
const rowContains = 'text-white hover:bg-white/[0.07]';

export const DashboardLayout = ({ role, nav }: Props) => {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, can, logout } = useAuth();

  const isMember = user?.role === 'MEMBER';
  const effectiveRole: DashboardRole = isMember ? 'member' : role;
  const effectiveNav = isMember ? memberNav : nav;
  const meta = roleMeta[effectiveRole] || roleMeta[role];

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
  const visibleNav = filterVisible(effectiveNav);

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

  // ---- Sidebar "Find" ------------------------------------------------------
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const q = query.trim().toLowerCase();
  const searching = q.length > 0;

  /** Keep items whose label matches, plus groups that have a matching descendant. */
  const matchTree = (items: DashboardNavItem[]): DashboardNavItem[] =>
    items.flatMap((item) => {
      if (item.label.toLowerCase().includes(q)) return [item];
      if (item.children) {
        const kids = matchTree(item.children);
        return kids.length ? [{ ...item, children: kids }] : [];
      }
      return [];
    });
  const shownNav = searching ? matchTree(visibleNav) : visibleNav;

  // Press "F" anywhere (outside inputs) to jump to the sidebar search.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'f' || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      if (!searchRef.current || searchRef.current.offsetParent === null) return;
      e.preventDefault();
      searchRef.current.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ---- Nav rendering -------------------------------------------------------
  // `collapsed` is desktop-only: the mobile drawer always renders expanded.
  const renderList = (items: DashboardNavItem[], pathKey: string, collapsed: boolean): React.ReactNode =>
    items.map((item, i) => (
      <Fragment key={`${pathKey}/${item.label}`}>
        {i > 0 && !searching && !collapsed && extras(item).dividerBefore && (
          <div role="separator" className="mx-1 my-2 border-t border-white/10" />
        )}
        {renderNode(item, pathKey, collapsed)}
      </Fragment>
    ));

  const renderNode = (item: DashboardNavItem, pathKey: string, collapsed: boolean): React.ReactNode => {
    const key = `${pathKey}/${item.label}`;
    const Icon = item.icon;

    // Group: the whole row reads as one item with a chevron on the right.
    // With `to`, the label navigates to the overview page and the chevron
    // toggles; without `to`, the entire row toggles.
    if (item.children?.length) {
      const isOpen = searching || (expanded[key] ?? containsActive(item));
      const chevron = (
        <ChevronRight
          size={16}
          aria-hidden="true"
          className={cx('shrink-0 text-white/50 transition-transform duration-150', isOpen && 'rotate-90')}
        />
      );

      return (
        <div>
          {item.to ? (
            <div className="relative">
              <NavLink
                to={item.to}
                end
                title={collapsed ? item.label : undefined}
                onClick={() => {
                  setOpen(false);
                  setExpanded((prev) => ({ ...prev, [key]: true }));
                }}
                className={({ isActive }) =>
                  cx(rowBase,  collapsed && 'justify-center px-0', isActive ? rowActive : containsActive(item) ? rowContains : rowIdle)
                }
              >
                <Icon size={20} strokeWidth={0.75} aria-hidden="true" className="shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
              {!collapsed && (
                <button
                  type="button"
                  onClick={() => toggleGroup(key)}
                  aria-expanded={isOpen}
                  aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${item.label}`}
                  className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded hover:bg-white/10"
                >
                  {chevron}
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => toggleGroup(key)}
              aria-expanded={isOpen}
              title={collapsed ? item.label : undefined}
              className={cx(rowBase, collapsed ? 'justify-center px-0' : 'justify-between text-left', containsActive(item) ? rowContains : rowIdle)}
            >
              <span className="flex min-w-0 items-center gap-3">
                <Icon size={18} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </span>
              {!collapsed && chevron}
            </button>
          )}

          {isOpen && !collapsed && (
            <div className="ml-[21px] mt-0.5 space-y-0.5 border-l border-white/10 pl-2">
              {renderList(item.children, key, collapsed)}
            </div>
          )}
        </div>
      );
    }

    if (!item.to) return null;
    const to = item.to;

    if (extras(item).disabled) {
      return (
        <span
          aria-disabled="true"
          title={collapsed ? item.label : undefined}
          className={cx(rowBase, collapsed ? 'justify-center px-0' : '', 'cursor-not-allowed text-white/30')}
        >
          <Icon size={18} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </span>
      );
    }

    return (
      <NavLink
        to={to}
        end={to.split('/').length <= 3}
        title={collapsed ? item.label : undefined}
        onClick={() => setOpen(false)}
        className={({ isActive }) => cx(rowBase, 'justify-between', collapsed && 'justify-center px-0', isActive ? rowActive : rowIdle)}
      >
        <span className="flex min-w-0 items-center gap-3">
          <Icon size={18} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
          {!collapsed && <span className="truncate">{item.label}</span>}
        </span>
        {!collapsed && item.badge && (
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-semibold text-white/80">
            {item.badge}
          </span>
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

  const sidebar = (isCollapsed: boolean) => (
    <div className="flex h-full flex-col bg-brand-900 text-white">
      <Link
        to={ROUTES.home}
        className={cx('flex items-center gap-3 px-5 pb-3 pt-5', isCollapsed && 'justify-center px-0')}
        title={isCollapsed ? siteInfo.name : undefined}
      >
        <img src="/logo.png" alt="Learnwithuncletee" className="h-8 w-8 shrink-0 rounded-full border border-white/20 object-cover" />
        {!isCollapsed && <span className="font-display text-sm font-extrabold leading-tight">{siteInfo.name}</span>}
      </Link>

      {/* Find */}
      {!isCollapsed && (
        <div className="px-3 pb-3">
          <label className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/[0.04] px-3 py-2 text-white/60 transition-colors focus-within:border-white/40 focus-within:text-white">
            <Search size={17} strokeWidth={1.75} aria-hidden="true" className="shrink-0" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setQuery('');
                  e.currentTarget.blur();
                }
              }}
              placeholder="Find"
              aria-label="Find in navigation"
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/50"
            />
            {searching ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  searchRef.current?.focus();
                }}
                aria-label="Clear search"
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-white/60 hover:bg-white/10 hover:text-white"
              >
                <X size={14} aria-hidden="true" />
              </button>
            ) : (
              <kbd className="hidden h-5 w-5 shrink-0 items-center justify-center rounded border border-white/20 bg-white/10 font-sans text-[11px] font-semibold text-white/80 lg:flex">
                F
              </kbd>
            )}
          </label>
        </div>
      )}

      <nav className="scroll-slim flex-1 space-y-0.5 overflow-y-auto px-3 pb-4" aria-label={`${meta.title} navigation`}>
        {shownNav.length ? (
          renderList(shownNav, '', isCollapsed)
        ) : (
          <p className="px-3 py-6 text-center text-sm text-white/50">No matches for “{query.trim()}”</p>
        )}
      </nav>

      <div className="space-y-0.5 border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => setAccountOpen(true)}
          aria-label="Open account settings"
          title={isCollapsed ? displayName : undefined}
          className={cx(
            'flex w-full items-center gap-3 rounded-md p-2 text-left transition-colors hover:bg-white/[0.07]',
            isCollapsed && 'justify-center px-0',
          )}
        >
          {avatar ? (
            <img src={avatar} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime-accent text-sm font-extrabold text-brand-900">
              {initials}
            </span>
          )}
          {!isCollapsed && (
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-semibold">{displayName}</span>
              <span className="block truncate text-xs text-white/50">{detail}</span>
            </span>
          )}
        </button>

        {user ? (
          <button
            type="button"
            onClick={handleLogout}
            title={isCollapsed ? 'Sign out' : undefined}
            className={cx(rowBase, rowIdle, isCollapsed && 'justify-center px-0')}
          >
            <LogOut size={18} strokeWidth={1.75} aria-hidden="true" className="shrink-0" /> {!isCollapsed && 'Sign out'}
          </button>
        ) : (
          <Link
            to={ROUTES.login}
            title={isCollapsed ? 'Sign in' : undefined}
            className={cx(
              'mb-1 block rounded-md bg-lime-accent px-3 py-2.5 text-center text-sm font-semibold text-brand-900 hover:bg-white',
              isCollapsed && 'px-0',
            )}
          >
            {isCollapsed ? '→' : 'Sign in'}
          </Link>
        )}
        <Link to={ROUTES.home} title={isCollapsed ? 'Back to website' : undefined} className={cx(rowBase, rowIdle, isCollapsed && 'justify-center px-0')}>
          <ChevronLeft size={18} strokeWidth={1.75} aria-hidden="true" className="shrink-0" /> {!isCollapsed && 'Back to website'}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-cream font-sans text-ink">
      
      {/* Desktop sidebar */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 transition-[width] duration-200 lg:block ${
          collapsed ? 'w-20' : 'w-72'
        }`}
      >
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="z-50 bg-white absolute -right-3 top-7 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-line  text-brand-800 shadow-lg hover:bg-brand-50"
        >
          {collapsed ? (
            <ChevronsRight size={15} aria-hidden="true" />
          ) : (
            <ChevronsLeft size={15} aria-hidden="true" />
          )}
        </button>
        {sidebar(collapsed)}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Dashboard menu">
          <button type="button" aria-label="Close menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-brand-900/60" />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw]">{sidebar(false)}</aside>
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