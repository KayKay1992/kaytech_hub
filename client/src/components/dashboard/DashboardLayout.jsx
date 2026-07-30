import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import NotificationBell from './NotificationBell';
import { useAuth } from '../../context/AuthContext';
import useBodyScrollLock from '../../hooks/useBodyScrollLock';

// Shared responsive shell for every role-gated dashboard (Admin, Student,
// Instructor). Desktop: sidebar is always visible in the normal layout.
// Mobile: sidebar is a slide-in drawer, opened via the hamburger button in
// the topbar, closed via the same button, an overlay click, or the
// sidebar's own close (X) button.
//
// `notificationsBasePath` (e.g. "/student") is optional — pass it to show
// the unread-notifications bell in the topbar. Admin doesn't pass it.
export default function DashboardLayout({ navGroups, brandLabel, notificationsBasePath }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  // While the mobile drawer is open, lock background scroll so the page
  // doesn't feel "stuck" — the full-screen overlay otherwise swallows
  // scroll gestures without actually scrolling anything.
  useBodyScrollLock(sidebarOpen);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="dashboard-layout">
      <DashboardSidebar
        navGroups={navGroups}
        brandLabel={brandLabel}
        open={sidebarOpen}
        onClose={closeSidebar}
      />
      {sidebarOpen && <div className="mobile-drawer-overlay" onClick={closeSidebar} />}

      <div className="dashboard-layout__main">
        <header className="dashboard-topbar">
          <button
            type="button"
            className="dashboard-menu-toggle"
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen((open) => !open)}
          >
            <span /><span /><span />
          </button>

          <Link to="/" className="dashboard-topbar__site-link">&larr; Back to site</Link>

          <div className="dashboard-topbar__actions">
            {notificationsBasePath && <NotificationBell basePath={notificationsBasePath} />}
            <span className="dashboard-topbar__user">{user?.name} ({user?.role})</span>
            <button type="button" className="btn btn--ghost" onClick={handleLogout}>Log out</button>
          </div>
        </header>

        <div className="dashboard-layout__content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
