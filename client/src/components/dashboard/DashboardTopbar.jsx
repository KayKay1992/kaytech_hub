import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, House, LogOut, Menu, User } from 'lucide-react';
import NotificationBell from './NotificationBell';
import ThemeToggle from '../common/ThemeToggle';
import { getInitials } from '../../utils/initials';
import { getDashboardPath } from '../../utils/roleRoutes';

const OBJECT_ID_RE = /^[0-9a-f]{24}$/i;

const humanize = (segment) => segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// Best-effort page title: matches the current path against the nav items
// passed in (longest match wins), falling back to a humanized last path
// segment for sub-pages (edit forms, detail views) that have no nav entry.
const derivePageTitle = (navGroups, pathname) => {
  let best = null;
  navGroups.forEach((group) => {
    group.items.forEach((item) => {
      if (item.disabled) return;
      const matches = item.end ? pathname === item.to : pathname.startsWith(item.to);
      if (matches && (!best || item.to.length > best.to.length)) best = item;
    });
  });
  if (best) return best.label;

  const segments = pathname.split('/').filter(Boolean).filter((s) => !OBJECT_ID_RE.test(s));
  const last = segments[segments.length - 1];
  return last ? humanize(last) : 'Dashboard';
};

// Small avatar — the user's uploaded photo if set, initials otherwise.
function UserAvatar({ user, large }) {
  const className = `user-menu__avatar${large ? ' user-menu__avatar--lg' : ''}`;
  if (user?.photo_url) {
    return <img src={user.photo_url} alt={user?.name || 'Profile photo'} className={className} />;
  }
  return <span className={className}>{getInitials(user?.name)}</span>;
}

// Avatar + dropdown (Profile — links to the shared account page; Log out —
// wired to the real handler).
function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const profilePath = `${getDashboardPath(user?.role)}/profile`;

  useEffect(() => {
    if (!open) return undefined;
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const handleKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  return (
    <div className="user-menu" ref={ref}>
      <button type="button" className="user-menu__trigger" onClick={() => setOpen((v) => !v)} aria-haspopup="true" aria-expanded={open}>
        <UserAvatar user={user} />
        <ChevronDown size={16} className={`user-menu__chevron${open ? ' is-open' : ''}`} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="user-menu__panel"
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
          >
            <div className="user-menu__header">
              <UserAvatar user={user} large />
              <div className="user-menu__header-text">
                <strong>{user?.name}</strong>
                <span className="user-menu__email">{user?.email}</span>
                <span className="badge" style={{ marginTop: 6 }}>{user?.role}</span>
              </div>
            </div>
            <div className="user-menu__divider" />
            <Link to={profilePath} className="user-menu__item" onClick={() => setOpen(false)}>
              <User size={16} aria-hidden="true" /> Profile
            </Link>
            <button type="button" className="user-menu__item user-menu__item--danger" onClick={onLogout}>
              <LogOut size={16} aria-hidden="true" /> Log out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sits above the content area — page title on the left, notifications +
// user menu on the right, and (mobile only) the sidebar hamburger toggle.
export default function DashboardTopbar({ navGroups, notificationsBasePath, sidebarOpen, onToggleSidebar, user, onLogout }) {
  const location = useLocation();
  const title = derivePageTitle(navGroups, location.pathname);

  return (
    <header className="dashboard-topbar">
      <button
        type="button"
        className="dashboard-menu-toggle"
        aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
        aria-expanded={sidebarOpen}
        onClick={onToggleSidebar}
      >
        <Menu size={22} />
      </button>

      <Link to="/" className="dashboard-topbar__home" title="Back to site" aria-label="Back to site">
        <House size={18} />
      </Link>

      <h1 className="dashboard-topbar__title">{title}</h1>

      <div className="dashboard-topbar__actions">
        <ThemeToggle />
        {notificationsBasePath && <NotificationBell basePath={notificationsBasePath} />}
        <UserMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  );
}
